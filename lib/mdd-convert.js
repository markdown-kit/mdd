/**
 * MDD Converters — DOCX and PDF output for the AI-to-Office pipeline.
 *
 * - DOCX: MDD semantic directives are mapped onto real DOCX constructs via
 *   @markdownkit/md-docx (`::header`/`::footer` → page header/footer,
 *   `::page-break` → page break, `::letterhead`/`::contact-info`/
 *   `::signature-block` → styled paragraphs). Pure-JS, no system dependency.
 * - PDF: the canonical print-optimized HTML (generateMddHtml) is rendered with
 *   headless Chrome (Puppeteer), reusing the exact preview CSS. Puppeteer is an
 *   optional dependency loaded lazily, so DOCX/HTML users never pay for it.
 */

import { writeFile } from 'node:fs/promises'

import { convertMarkdownToDocx } from '@markdownkit/md-docx'
import { extractFrontmatter } from '@markdownkit/remark-mdd/validator'

import { generateMddHtml } from './preview-core.js'

const CODE_FENCE = /^(`{3,}|~{3,})/
const BLOCK_DIRECTIVES = new Set([
  'letterhead',
  'header',
  'footer',
  'contact-info',
  'signature-block',
])

/**
 * Strip the leading YAML frontmatter block from MDD content.
 *
 * @param {string} content
 * @returns {string}
 */
function stripFrontmatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '')
}

/**
 * Transform MDD content into a markdown document plus extracted header/footer
 * text suitable for @markdownkit/md-docx. Directive markers are consumed and
 * mapped to DOCX-friendly constructs; semantic-class annotations are dropped.
 *
 * @param {string} content - Raw MDD content (frontmatter optional)
 * @returns {{ markdown: string, header: string | null, footer: string | null }}
 */
export function mddToDocxInput(content) {
  const body = stripFrontmatter(content)
  const lines = body.split(/\r?\n/u)

  const out = []
  let header = null
  let footer = null

  let fenceMarker = null
  let current = null // { type, lines: [] }

  const flush = () => {
    if (!current) {
      return
    }
    const text = current.lines.join('\n').trim()
    if (current.type === 'header') {
      header = text ?? header
    } else if (current.type === 'footer') {
      footer = text ?? footer
    } else if (current.type === 'letterhead') {
      // Letterhead: emphasize the organization name (first line).
      const [first, ...rest] = current.lines.map((line) => line.trim()).filter(Boolean)
      if (first) {
        out.push(`**${first}**`, ...rest, '')
      }
    } else if (text) {
      out.push(...current.lines.map((line) => line.trim()).filter(Boolean), '')
    }
    current = null
  }

  for (const rawLine of lines) {
    const line = rawLine
    const trimmed = line.trim()

    // Pass code fences through verbatim and ignore directives inside them.
    const fenceMatch = trimmed.match(CODE_FENCE)
    if (fenceMatch) {
      const marker = fenceMatch[1][0]
      if (fenceMarker === null) fenceMarker = marker
      else if (fenceMarker === marker) fenceMarker = null
      out.push(line)
      continue
    }
    if (fenceMarker !== null) {
      out.push(line)
      continue
    }

    // Inline self-closing directives.
    if (/^::page-break\s*::\s*$/.test(trimmed) || /^::page-break\s*$/.test(trimmed)) {
      // A bare `::page-break` opens a block whose `::` closes it; treat both
      // the inline and block opener as a page break and swallow a following
      // lone `::` end marker.
      if (trimmed === '::page-break') {
        flush()
        current = { type: '__pagebreak-open', lines: [] }
        out.push('\\pagebreak', '')
        continue
      }
      flush()
      out.push('\\pagebreak', '')
      continue
    }
    if (
      /^:::\s*section-break\s*:::\s*$/.test(trimmed) ||
      /^:::\s*section-break\s*$/.test(trimmed)
    ) {
      flush()
      out.push('---', '')
      if (/:::\s*$/.test(trimmed) === false) {
        current = { type: '__sectionbreak-open', lines: [] }
      }
      continue
    }

    // End markers.
    if (trimmed === '::' || trimmed === ':::') {
      if (current && current.type?.startsWith('__')) {
        current = null
        continue
      }
      flush()
      continue
    }

    // Block directive openers.
    const opener = trimmed.match(/^::([a-z-]+)$/)
    if (opener && BLOCK_DIRECTIVES.has(opener[1])) {
      flush()
      current = { type: opener[1], lines: [] }
      continue
    }

    if (current && !current.type.startsWith('__')) {
      current.lines.push(line)
      continue
    }

    // Plain content: drop semantic-class annotations, keep text.
    out.push(line.replace(/\s*\{\.[a-z][a-z0-9-]*\}/g, ''))
  }

  flush()

  return {
    markdown: `${out
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()}\n`,
    header,
    footer,
  }
}

/**
 * Convert MDD content to a DOCX file.
 *
 * @param {string} content - Raw MDD content
 * @param {string} outputPath - Destination .docx path
 * @param {object} [options] - Extra @markdownkit/md-docx options to merge
 * @returns {Promise<{ outputPath: string, bytes: number }>}
 */
export async function convertToDocx(content, outputPath, options = {}) {
  const { markdown, header, footer } = mddToDocxInput(content)
  const frontmatter = extractFrontmatter(content) ?? {}

  const docxOptions = { ...options }
  if (typeof frontmatter.title === 'string' && !docxOptions.title) {
    docxOptions.title = frontmatter.title
  }
  if (header) {
    docxOptions.headers = { default: { text: header, alignment: 'CENTER' }, ...docxOptions.headers }
  }
  if (footer) {
    docxOptions.footers = { default: { text: footer, alignment: 'CENTER' }, ...docxOptions.footers }
  }

  const blob = await convertMarkdownToDocx(markdown, docxOptions)
  const buffer = Buffer.from(await blob.arrayBuffer())
  await writeFile(outputPath, buffer)

  return { outputPath, bytes: buffer.length }
}

let puppeteerModule
let puppeteerError = null

/**
 * Lazily load Puppeteer with a clear, actionable error when it is missing.
 *
 * @returns {Promise<typeof import('puppeteer')>}
 */
async function loadPuppeteer() {
  if (puppeteerModule) {
    return puppeteerModule
  }
  if (puppeteerError) {
    throw puppeteerError
  }
  try {
    const mod = await import('puppeteer')
    puppeteerModule = mod.default ?? mod
    return puppeteerModule
  } catch (err) {
    puppeteerError = new Error(
      'PDF output requires Puppeteer (headless Chrome) which is not installed. ' +
        'Install it with `pnpm add puppeteer` (it is an optional dependency of @markdownkit/mdd).',
    )
    puppeteerError.cause = err
    throw puppeteerError
  }
}

/**
 * Convert MDD content to a PDF file by printing the canonical preview HTML
 * with headless Chrome (reusing the print-optimized preview CSS).
 *
 * @param {string} content - Raw MDD content
 * @param {string} outputPath - Destination .pdf path
 * @param {{ filePath?: string, format?: string }} [options]
 * @returns {Promise<{ outputPath: string }>}
 */
export async function convertToPdf(content, outputPath, options = {}) {
  const html = await generateMddHtml(content, { filePath: options.filePath })
  const puppeteer = await loadPuppeteer()

  const browser = await puppeteer.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.pdf({
      path: outputPath,
      format: options.format ?? 'Letter',
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
  } finally {
    await browser.close()
  }

  return { outputPath }
}

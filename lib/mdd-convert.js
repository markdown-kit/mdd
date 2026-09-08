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

import { randomUUID } from 'node:crypto'
import { rename, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

import { convertMarkdownToDocx } from '@markdownkit/md-docx'
import { validateDocument } from '@markdownkit/remark-mdd/validator'

import { generateMddHtml } from './preview-core.js'

const CODE_FENCE = /^(`{3,}|~{3,})/
const BLOCK_DIRECTIVES = new Set([
  'letterhead',
  'header',
  'footer',
  'contact-info',
  'signature-block',
])

export class MddConversionValidationError extends Error {
  constructor(validation) {
    const details = validation.errors.map((issue) => `[${issue.code}] ${issue.message}`).join('\n')
    super(`MDD validation failed; no output was written:\n${details}`)
    this.name = 'MddConversionValidationError'
    this.validation = validation
  }
}

export function validateMddForConversion(content, options = {}) {
  const validation = validateDocument(content, { strict: options.strict ?? false })
  if (!validation.valid) {
    throw new MddConversionValidationError(validation)
  }
  return validation
}

function temporaryOutputPath(outputPath) {
  return join(dirname(outputPath), `.${basename(outputPath)}.${randomUUID()}.tmp`)
}

async function writeFileAtomic(outputPath, data, encoding) {
  const temporaryPath = temporaryOutputPath(outputPath)
  try {
    await writeFile(temporaryPath, data, encoding)
    await rename(temporaryPath, outputPath)
  } catch (err) {
    await unlink(temporaryPath).catch(() => {})
    throw err
  }
}

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

  const toHeaderFooterText = (value) =>
    value
      .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gu, '$1 ($2)')
      .replace(/(?:\*\*|__|\*|_|~~|`)/gu, '')
      .trim()

  // Block-level tokens (`\pagebreak`, `---`) are only recognised by md-docx
  // when they form their own paragraph. Without a preceding blank line a
  // `\pagebreak` joins the previous paragraph as text and `---` turns it into
  // a setext heading, so always separate them from adjacent content.
  const pushBlock = (token) => {
    if (out.length > 0 && out.at(-1) !== '') {
      out.push('')
    }
    out.push(token, '')
  }

  const appendSemanticBlock = (type, lines) => {
    out.push(`<!-- mdd:${type} -->`)
    for (const line of lines) {
      out.push(line.length > 0 ? `> ${line}` : '>')
    }
    out.push('')
  }

  const flush = () => {
    if (!current) {
      return
    }
    const text = current.lines.join('\n').trim()
    if (current.type === 'header') {
      header = toHeaderFooterText(text) || header
    } else if (current.type === 'footer') {
      footer = toHeaderFooterText(text) || footer
    } else if (text) {
      appendSemanticBlock(current.type, current.lines)
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
      flush()
      if (trimmed === '::page-break') {
        current = { type: '__pagebreak-open', lines: [] }
      }
      pushBlock('\\pagebreak')
      continue
    }
    if (
      /^:::\s*section-break\s*:::\s*$/.test(trimmed) ||
      /^:::\s*section-break\s*$/.test(trimmed)
    ) {
      flush()
      pushBlock('---')
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

    const semanticClass = line.match(/^(.*\S)\s*\{\.([a-z][a-z0-9-]*)\}\s*$/u)
    if (semanticClass) {
      const [, semanticText, className] = semanticClass
      if (/^#{1,6}\s/u.test(semanticText)) {
        out.push(semanticText)
      } else {
        out.push(`<!-- mdd:class:${className} -->`, `> ${semanticText}`)
      }
      continue
    }

    out.push(line)
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
  validateMddForConversion(content, { strict: options.strict })
  const { markdown, header, footer } = mddToDocxInput(content)

  // md-docx reads page furniture from `template`/`sections`, never from the
  // top level. ::header/::footer become the default header/footer slots; a
  // `{{page}}` token in their text is rendered as a live page-number field by
  // md-docx. Page numbers are otherwise off so the DOCX matches HTML/PDF,
  // where only an explicit `{{page}}` produces one.
  const { strict: _strict, template: callerTemplate, ...docxOptions } = options
  const template = {
    pageNumbering: { display: 'none' },
    ...callerTemplate,
    ...(header
      ? {
          headers: {
            default: { text: header, alignment: 'CENTER', pageNumberDisplay: 'none' },
            ...callerTemplate?.headers,
          },
        }
      : {}),
    ...(footer
      ? {
          footers: {
            default: { text: footer, alignment: 'CENTER', pageNumberDisplay: 'none' },
            ...callerTemplate?.footers,
          },
        }
      : {}),
  }

  const blob = await convertMarkdownToDocx(markdown, { ...docxOptions, template })
  const buffer = Buffer.from(await blob.arrayBuffer())
  await writeFileAtomic(outputPath, buffer)

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
  validateMddForConversion(content, { strict: options.strict })
  // Final output: the document has already passed validation, so the preview's
  // embedded validation report must not appear in the deliverable.
  const html = await generateMddHtml(content, { filePath: options.filePath, validate: false })
  const puppeteer = await loadPuppeteer()

  try {
    puppeteer.executablePath()
  } catch (err) {
    throw new Error(
      'PDF output requires a Puppeteer-compatible Chrome installation. ' +
        'Install the pinned browser with `pnpm exec puppeteer browsers install chrome` ' +
        'or configure Puppeteer to use an existing Chrome executable.',
      { cause: err },
    )
  }

  const temporaryPath = temporaryOutputPath(outputPath)
  let browser
  try {
    browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.pdf({
      path: temporaryPath,
      format: options.format ?? 'Letter',
      printBackground: true,
      preferCSSPageSize: false,
      // Matches the 1in page margin declared by the preview's @page rule.
      margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
    })
    await rename(temporaryPath, outputPath)
  } finally {
    await browser?.close()
    await unlink(temporaryPath).catch(() => {})
  }

  return { outputPath }
}

export async function convertToHtml(content, outputPath, options = {}) {
  validateMddForConversion(content, { strict: options.strict })
  const html = await generateMddHtml(content, { filePath: options.filePath, validate: false })
  await writeFileAtomic(outputPath, html, 'utf8')
  return { outputPath, bytes: Buffer.byteLength(html) }
}

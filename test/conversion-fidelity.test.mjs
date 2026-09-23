import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { convertToDocx, convertToHtml, convertToPdf, mddToDocxInput } from '../lib/mdd-convert.js'

const INVALID = '# Invoice\n\nBody only.\n'
const VALID = `---
title: "Report"
document-type: "report"
date: "2026-07-15"
author: "Author"
---

# Report

Body.
`

test('all conversion entry points reject invalid MDD before writing output', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'mdd-conversion-'))
  try {
    for (const [name, convert] of [
      ['invalid.html', convertToHtml],
      ['invalid.docx', convertToDocx],
    ]) {
      const outputPath = join(directory, name)
      await assert.rejects(convert(INVALID, outputPath), /MDD validation failed/u)
      await assert.rejects(readFile(outputPath), { code: 'ENOENT' })
    }

    const outputPath = join(directory, 'valid.html')
    await convertToHtml(VALID, outputPath, { filePath: 'valid.mdd' })
    assert.match(await readFile(outputPath, 'utf8'), /<h1/u)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('MDD to DOCX input retains rich Markdown in semantic blocks', () => {
  const { markdown } = mddToDocxInput(`---
title: "Letter"
document-type: "other"
---

::letterhead
**Acme** [site](https://example.com)
::
`)

  assert.match(markdown, /\*\*Acme\*\*/u)
  assert.match(markdown, /\[site\]\(https:\/\/example\.com\)/u)
})

/**
 * Minimal DOCX (zip) reader: returns the UTF-8 text of one entry using the
 * central directory, so tests can assert on real Word XML without extra deps.
 */
async function readDocxEntry(docxPath, entryName) {
  const { inflateRawSync } = await import('node:zlib')
  const buffer = await readFile(docxPath)
  const eocd = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  const entryCount = buffer.readUInt16LE(eocd + 10)
  let offset = buffer.readUInt32LE(eocd + 16)
  for (let i = 0; i < entryCount; i++) {
    const method = buffer.readUInt16LE(offset + 10)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const nameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const localOffset = buffer.readUInt32LE(offset + 42)
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength)
    if (name === entryName) {
      const localNameLength = buffer.readUInt16LE(localOffset + 26)
      const localExtraLength = buffer.readUInt16LE(localOffset + 28)
      const dataStart = localOffset + 30 + localNameLength + localExtraLength
      const data = buffer.subarray(dataStart, dataStart + compressedSize)
      return (method === 8 ? inflateRawSync(data) : data).toString('utf8')
    }
    offset += 46 + nameLength + extraLength + commentLength
  }
  throw new Error(`${entryName} not found in ${docxPath}`)
}

const LETTER = `---
title: "Letter"
document-type: "business-letter"
date: "2026-07-15"
author: "Author"
recipient: "Client"
subject: "Subject"
---

::header
Acme | Proposal
::

::footer
Page {{page}} | Confidential
::

::letterhead
**Acme Corp**
123 Main Street
::

::contact-info
Phone: 555-0100
::

Body paragraph before the break.

::page-break ::

# Terms

Water is H~2~O and the 2^nd^ clause applies.

::signature-block
Signed
::
`

test('::header/::footer become real DOCX page furniture with a live page-number field', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'mdd-docx-'))
  try {
    const outputPath = join(directory, 'letter.docx')
    await convertToDocx(LETTER, outputPath)

    const header = await readDocxEntry(outputPath, 'word/header1.xml')
    const footer = await readDocxEntry(outputPath, 'word/footer1.xml')
    const body = await readDocxEntry(outputPath, 'word/document.xml')

    assert.match(header, /Acme \| Proposal/u)
    assert.doesNotMatch(header, /PAGE/u)
    assert.match(footer, /<w:t[^>]*>Page <\/w:t>/u)
    assert.match(footer, /<w:instrText[^>]*>PAGE<\/w:instrText>/u)
    assert.match(footer, /\| Confidential/u)
    assert.doesNotMatch(footer, /\{\{page\}\}/u)

    // Letterhead markdown is rendered as formatting, not literal markers.
    assert.match(body, /<w:b\/>[\s\S]{0,200}Acme Corp/u)
    assert.doesNotMatch(body, /\*\*Acme Corp\*\*/u)
    // Header/footer text never leaks into the body.
    assert.doesNotMatch(body, /Acme \| Proposal/u)
    // The page break after a paragraph line is a real page break, not text.
    assert.match(body, /<w:br w:type="page"\/>/u)
    assert.doesNotMatch(body, /\\pagebreak/u)
    // MDD typography becomes real super/subscript runs.
    assert.match(body, /<w:vertAlign w:val="subscript"\/>[\s\S]{0,120}<w:t[^>]*>2<\/w:t>/u)
    assert.match(body, /<w:vertAlign w:val="superscript"\/>[\s\S]{0,120}<w:t[^>]*>nd<\/w:t>/u)
    assert.doesNotMatch(body, /H~2~O|2\^nd\^|&lt;sub&gt;/u)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

/**
 * The PDF test needs headless Chrome (optional puppeteer dependency) and
 * poppler's pdftotext; report why it is skipped instead of failing on machines
 * without them.
 */
async function pdfToolingUnavailableReason() {
  const { execFile } = await import('node:child_process')
  const { promisify } = await import('node:util')
  try {
    await promisify(execFile)('pdftotext', ['-v'])
  } catch {
    return 'pdftotext (poppler) is not installed'
  }
  try {
    const puppeteer = await import('puppeteer')
    if (!existsSync(await (puppeteer.default ?? puppeteer).executablePath())) {
      return 'puppeteer is installed but its Chrome executable is missing'
    }
  } catch {
    return 'puppeteer with a Chrome installation is not available'
  }
  return null
}

test('DOCX keeps md-docx page numbering when ::footer has no {{page}} token', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'mdd-docx-'))
  try {
    const withFooter = join(directory, 'footer.docx')
    await convertToDocx(
      '---\ntitle: "Memo"\ndocument-type: "memo"\ndate: "2026-01-05"\n---\n\n::footer\nConfidential\n::\n\n# Memo\n\nBody.\n',
      withFooter,
    )
    const footer = await readDocxEntry(withFooter, 'word/footer1.xml')
    assert.match(footer, /Confidential/u)
    assert.match(footer, /<w:instrText[^>]*>PAGE<\/w:instrText>/u)

    const noFooter = join(directory, 'plain.docx')
    await convertToDocx(
      '---\ntitle: "Memo"\ndocument-type: "memo"\ndate: "2026-01-05"\n---\n\n# Memo\n\nBody.\n',
      noFooter,
    )
    assert.match(
      await readDocxEntry(noFooter, 'word/footer1.xml'),
      /<w:instrText[^>]*>PAGE<\/w:instrText>/u,
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('PDF output repeats ::header/::footer on every page with live page numbers', async (t) => {
  const unavailable = await pdfToolingUnavailableReason()
  if (unavailable) {
    t.skip(unavailable)
    return
  }

  const directory = await mkdtemp(join(tmpdir(), 'mdd-pdf-'))
  try {
    const outputPath = join(directory, 'letter.pdf')
    const longBody = `${LETTER}\n${'Filler paragraph for pagination.\n\n'.repeat(80)}`
    await convertToPdf(longBody, outputPath, { filePath: 'letter.mdd' })
    const { execFile } = await import('node:child_process')
    const { promisify } = await import('node:util')
    const { stdout } = await promisify(execFile)('pdftotext', ['-layout', outputPath, '-'])
    const pages = stdout.split('\f').filter((page) => page.trim().length > 0)
    assert.ok(pages.length >= 2, `expected a multi-page PDF, got ${pages.length}`)
    pages.forEach((page, index) => {
      assert.match(page, /Acme \| Proposal/u, `header missing on page ${index + 1}`)
      assert.match(page, new RegExp(`Page ${index + 1} \\| Confidential`, 'u'))
    })
    assert.doesNotMatch(stdout, /\{\{page\}\}/u)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('block tokens are separated from adjacent paragraphs in the DOCX input', () => {
  const { markdown } = mddToDocxInput('Para\n::page-break ::\nNext\n::: section-break :::\nLast\n')
  assert.equal(markdown, 'Para\n\n\\pagebreak\n\nNext\n\n---\n\nLast\n')
})

test('final HTML output carries the document only, not the preview validation report', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'mdd-html-'))
  try {
    const outputPath = join(directory, 'letter.html')
    // A valid document that still produces validator warnings (no ::contact-info is recommended).
    const withWarnings = LETTER.replace(/::contact-info[\s\S]*?::\n\n/u, '')
    await convertToHtml(withWarnings, outputPath, { filePath: 'letter.mdd' })
    const html = await readFile(outputPath, 'utf8')
    assert.doesNotMatch(html, /<div class="validation-report">/u)
    assert.match(html, /<div class="letterhead"/u)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('DOCX typography leaves inline code, link destinations and autolinks alone', () => {
  for (const [input, expected] of [
    [
      'See [home](https://example.com/~user/~x) for details.',
      'See [home](https://example.com/~user/~x) for details.',
    ],
    ['Run `ls ~a~ b^c^` now.', 'Run `ls ~a~ b^c^` now.'],
    ['Run ``echo `~a~` ok`` now.', 'Run ``echo `~a~` ok`` now.'],
    ['Visit <https://example.com/~a~b>.', 'Visit <https://example.com/~a~b>.'],
    ['Visit https://example.com/~a/~b today.', 'Visit https://example.com/~a/~b today.'],
    ['![H~2~O](img/~a~.png)', '![H<sub>2</sub>O](img/~a~.png)'],
    ['H~2~O, `x^2^` and 2^nd^', 'H<sub>2</sub>O, `x^2^` and 2<sup>nd</sup>'],
  ]) {
    assert.equal(mddToDocxInput(input).markdown, `${expected}\n`, input)
  }
})

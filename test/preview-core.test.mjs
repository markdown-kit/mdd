import assert from 'node:assert/strict'
import test from 'node:test'

import { extractMetadata, generateMddHtml, processContent } from '../lib/preview-core.js'

void test('processContent renders MDD structure when given an mdd file path', async () => {
  const html = await processContent(
    `::letterhead
Acme Corp
::

::page-break
::
`,
    { filePath: 'sample.mdd' },
  )

  assert.match(html, /<div class="letterhead"[^>]*>/)
  assert.match(html, /Acme Corp/)
  assert.match(html, /<div class="page-break"[^>]*><\/div>/)
})

void test('generateMddHtml keeps MDD preview semantics for raw content requests', async () => {
  const html = await generateMddHtml(
    `---
title: "Preview"
document-type: "business-letter"
date: "2026-03-28"
author: "Author"
---

::signature-block
Signed by Author
::
`,
    { filePath: 'preview.mdd' },
  )

  assert.match(html, /<div class="signature"[^>]*>/)
  assert.match(html, /Signed by Author/)
})

void test('processContent preserves headings and rich Markdown inside directives', async () => {
  const html = await processContent(
    `# Invoice {.invoice-title}

::letterhead
**Acme** [site](https://example.com)

- One
- Two

::
`,
    { filePath: 'fidelity.mdd' },
  )

  assert.match(html, /<h1 class="invoice-title"[^>]*>1 Invoice<\/h1>/)
  assert.match(html, /<strong>Acme<\/strong>/)
  assert.match(html, /<a href="https:\/\/example\.com">site<\/a>/)
  assert.match(html, /<ul>[\s\S]*<li>One<\/li>[\s\S]*<li>Two<\/li>[\s\S]*<\/ul>/)
})

void test('extractMetadata supports CRLF-delimited frontmatter', () => {
  const lf = `---
title: "Preview"
document-type: "business-letter"
date: "2026-03-28"
author: "Author"
---

# Heading
`
  const crlf = lf.replace(/\n/g, '\r\n')

  const metadata = extractMetadata(crlf)
  assert.equal(metadata.title, 'Preview')
  assert.equal(metadata['document-type'], 'business-letter')
  assert.equal(metadata.date, '2026-03-28')
})

void test('MDD subscripts render as <sub>, not GFM strikethrough', async () => {
  const html = await processContent('Water is H~2~O and the 2^nd^ clause.\n', {
    filePath: 'chem.mdd',
  })
  assert.match(html, /H<sub>2<\/sub>O/)
  assert.match(html, /2<sup>nd<\/sup>/)
  assert.doesNotMatch(html, /<del>/)
})

void test('generateMddHtml omits the validation report when validate is false', async () => {
  const content = `---
title: "Report"
document-type: "report"
---

# Summary
`
  const withReport = await generateMddHtml(content, { filePath: 'r.mdd' })
  const withoutReport = await generateMddHtml(content, { filePath: 'r.mdd', validate: false })
  assert.match(withReport, /<div class="validation-report">/)
  assert.doesNotMatch(withoutReport, /<div class="validation-report">/)
})

void test('the stylesheet is a file the package exports, and the preview embeds it', async () => {
  const { readFileSync } = await import('node:fs')
  const { fileURLToPath } = await import('node:url')
  const { MDD_CSS, PREVIEW_CSS } = await import('../lib/preview-core.js')
  const file = readFileSync(fileURLToPath(import.meta.resolve('@markdownkit/mdd/mdd.css')), 'utf8')
  assert.equal(MDD_CSS, file)
  assert.match(MDD_CSS, /\.letterhead \{/)
  assert.match(MDD_CSS, /@media print/)
  assert.doesNotMatch(MDD_CSS, /validation-report/)
  assert.match(PREVIEW_CSS, /validation-report/)
  const html = await generateMddHtml(
    '---\ntitle: T\ndocument-type: memo\ndate: 2026-09-16\n---\n\nHi.\n',
    {
      validate: false,
    },
  )
  assert.ok(html.includes('.letterhead {') && html.includes('.validation-report {'))
})

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

  assert.match(html, /<div class="letterhead">/)
  assert.match(html, /Acme Corp/)
  assert.match(html, /<div class="page-break"><\/div>/)
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

  assert.match(html, /<div class="signature">/)
  assert.match(html, /Signed by Author/)
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

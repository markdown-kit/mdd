import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { migrateToMdd3 } from '../lib/migrate.js'

const examples = join(dirname(fileURLToPath(import.meta.url)), '..', 'examples')

const LEGACY = `---
title: "Letter"
document-type: "business-letter"
date: "2026-09-16"
---

::letterhead
Acme
::

::header
Acme | Page {{page}}
::

Text with a time 10:: in it.

::page-break ::

::page-break
::

::: section-break :::

::: section-break
:::

\`\`\`text
::letterhead
not a directive
::
\`\`\`

::signature-block
Jane
::
`

const CANONICAL = `---
title: "Letter"
document-type: "business-letter"
date: "2026-09-16"
---

:::letterhead
Acme
:::

:::header
Acme | Page {{page}}
:::

Text with a time 10:: in it.

::page-break

::page-break

::section-break

::section-break

\`\`\`text
::letterhead
not a directive
::
\`\`\`

:::signature-block
Jane
:::
`

test('rewrites every MDD 2 form into the MDD 3 spelling and leaves fences alone', () => {
  const { content, changed } = migrateToMdd3(LEGACY)
  assert.equal(content, CANONICAL)
  assert.ok(changed > 0)
})

test('is a fixed point on MDD 3 documents', () => {
  const { content, changed } = migrateToMdd3(CANONICAL)
  assert.equal(content, CANONICAL)
  assert.equal(changed, 0)
})

test('the shipped examples are already MDD 3', () => {
  for (const name of readdirSync(examples).filter((n) => n.endsWith('.mdd'))) {
    const text = readFileSync(join(examples, name), 'utf8')
    assert.equal(migrateToMdd3(text).changed, 0, name)
  }
})

test('keeps each line ending as it was (CRLF, LF, mixed)', () => {
  for (const [input, expected] of [
    ['::letterhead\r\nAcme\r\n::\r\n\r\nBody\r\n', ':::letterhead\r\nAcme\r\n:::\r\n\r\nBody\r\n'],
    ['::page-break\r\n::\r\nNext\r\n', '::page-break\r\nNext\r\n'],
    ['::letterhead\nAcme\r\n::\n', ':::letterhead\nAcme\r\n:::\n'],
    ['Body\r\nNo trailing newline', 'Body\r\nNo trailing newline'],
  ]) {
    assert.equal(migrateToMdd3(input).content, expected, JSON.stringify(input))
    assert.equal(migrateToMdd3(expected).content, expected, JSON.stringify(expected))
  }
})

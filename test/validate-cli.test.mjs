import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cli = join(root, 'mdd-validate.js')
// Valid, but with warnings (recommended metadata and directives missing).
const WARNINGS_ONLY = join(root, 'examples', 'invoice.mdd')

function validate(...args) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' })
  return { status: result.status, stdout: result.stdout }
}

test('--strict exits 1 when any file has errors, even if a later file only has warnings', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'mdd-validate-'))
  try {
    const invalid = join(directory, 'invalid.mdd')
    await writeFile(invalid, '# Invoice\n\nBody only.\n')

    assert.equal(validate('--strict', WARNINGS_ONLY).status, 2)
    assert.equal(validate('--strict', invalid, WARNINGS_ONLY).status, 1)
    assert.equal(validate('--strict', WARNINGS_ONLY, invalid).status, 1)
    assert.equal(validate(invalid, WARNINGS_ONLY).status, 1)
    assert.equal(validate(WARNINGS_ONLY).status, 0)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { convertToPdf } from '../lib/mdd-convert.js'

// Point Puppeteer at a browser that does not exist before it is first loaded.
process.env.PUPPETEER_EXECUTABLE_PATH = join(tmpdir(), 'mdd-no-such-chrome')

const VALID = `---
title: "Report"
document-type: "report"
date: "2026-07-15"
author: "Author"
---

# Report

Body.
`

test('PDF conversion explains how to install Chrome when the browser is missing', async (t) => {
  try {
    await import('puppeteer')
  } catch {
    t.skip('puppeteer (optional dependency) is not installed')
    return
  }

  const directory = await mkdtemp(join(tmpdir(), 'mdd-pdf-browser-'))
  try {
    const outputPath = join(directory, 'report.pdf')
    await assert.rejects(
      convertToPdf(VALID, outputPath),
      /Puppeteer-compatible Chrome installation/u,
    )
    await assert.rejects(readFile(outputPath), { code: 'ENOENT' })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

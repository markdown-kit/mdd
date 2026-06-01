#!/usr/bin/env node
/**
 * MDD Convert CLI — render .mdd documents to DOCX or PDF.
 *
 * Usage:
 *   mdd-convert <input.mdd> [output] [--format docx|pdf|html]
 *
 * The output format is inferred from the output file extension, or set with
 * --format. With no output path, the input name is reused with the new
 * extension.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, resolve } from 'node:path'

import { convertToDocx, convertToPdf } from './lib/mdd-convert.js'
import { generateMddHtml } from './lib/preview-core.js'

function parseArgs(argv) {
  const positionals = []
  let format = null
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--format' || arg === '-f') {
      format = argv[++i]
    } else if (arg.startsWith('--format=')) {
      format = arg.slice('--format='.length)
    } else if (!arg.startsWith('-')) {
      positionals.push(arg)
    }
  }
  return { positionals, format }
}

function usage() {
  console.error('Usage: mdd-convert <input.mdd> [output] [--format docx|pdf|html]')
  console.error('')
  console.error('Examples:')
  console.error('  mdd-convert contract.mdd                # -> contract.docx')
  console.error('  mdd-convert contract.mdd out.pdf        # -> out.pdf')
  console.error('  mdd-convert contract.mdd --format pdf   # -> contract.pdf')
}

async function main() {
  const { positionals, format } = parseArgs(process.argv.slice(2))

  if (positionals.length === 0) {
    usage()
    process.exit(1)
  }

  const inputPath = resolve(positionals[0])
  const inferredFormat =
    format ?? (positionals[1] ? extname(positionals[1]).slice(1).toLowerCase() : null) ?? 'docx'

  const normalizedFormat = inferredFormat.toLowerCase()
  if (!['docx', 'pdf', 'html'].includes(normalizedFormat)) {
    console.error(`Unsupported format: ${normalizedFormat} (expected docx, pdf, or html)`)
    process.exit(1)
  }

  const base = basename(inputPath, extname(inputPath))
  const outputPath = positionals[1]
    ? resolve(positionals[1])
    : resolve(dirname(inputPath), `${base}.${normalizedFormat}`)

  try {
    const content = await readFile(inputPath, 'utf-8')
    console.log(`Converting ${inputPath} -> ${outputPath} (${normalizedFormat})`)

    if (normalizedFormat === 'docx') {
      const { bytes } = await convertToDocx(content, outputPath, {})
      console.log(`✓ DOCX written: ${outputPath} (${bytes} bytes)`)
    } else if (normalizedFormat === 'pdf') {
      await convertToPdf(content, outputPath, { filePath: inputPath })
      console.log(`✓ PDF written: ${outputPath}`)
    } else {
      const html = await generateMddHtml(content, { filePath: inputPath })
      await writeFile(outputPath, html, 'utf-8')
      console.log(`✓ HTML written: ${outputPath}`)
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

void main()

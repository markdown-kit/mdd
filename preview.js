#!/usr/bin/env node
/**
 * MDD Preview Renderer CLI
 * Converts .mdd files to HTML for browser preview with validation
 */

import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname, basename } from 'node:path'

import { validateDocument } from '@markdownkit/remark-mdd/validator'
import { read } from 'to-vfile'

import {
  processContent,
  extractMetadata,
  generateValidationReport,
  MDD_CSS,
} from './lib/preview-core.js'

/**
 * Process MDD file (file-path variant for CLI usage)
 */
async function processMarkdown(filePath) {
  const file = await read(filePath)

  if (!file.path) {
    file.path = filePath
  }

  return processContent(String(file))
}

/**
 * Generate complete HTML document
 */
function generateHtml(content, metadata = {}, validationResult = null) {
  const validationHtml =
    validationResult && (validationResult.errors.length > 0 || validationResult.warnings.length > 0)
      ? generateValidationReport(validationResult)
      : ''

  const metadataHtml =
    metadata.title || metadata.date || metadata.author
      ? `<div class="metadata"><dl>
        ${metadata.title ? `<dt>Title:</dt><dd>${metadata.title}</dd>` : ''}
        ${metadata.date ? `<dt>Date:</dt><dd>${metadata.date}</dd>` : ''}
        ${metadata.author ? `<dt>Author:</dt><dd>${metadata.author}</dd>` : ''}
        ${metadata['document-type'] ? `<dt>Type:</dt><dd>${metadata['document-type']}</dd>` : ''}
      </dl></div>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title ?? 'MDD Document Preview'}</title>
  <style>${MDD_CSS}</style>
</head>
<body>
  <div class="document-container">
    ${validationHtml}
    ${metadataHtml}
    ${content}
  </div>
</body>
</html>`
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)

  // Parse options
  let skipValidation = false
  let strict = false
  const fileArgs = []

  for (const arg of args) {
    if (arg === '--no-validate') {
      skipValidation = true
    } else if (arg === '--strict') {
      strict = true
    } else if (!arg.startsWith('-')) {
      fileArgs.push(arg)
    }
  }

  if (fileArgs.length === 0) {
    console.error('Usage: node preview.js [OPTIONS] <input.mdd> [output.html]')
    console.error('')
    console.error('Options:')
    console.error('  --no-validate   Skip validation (faster preview)')
    console.error('  --strict        Treat warnings as errors')
    console.error('')
    console.error('Examples:')
    console.error('  node preview.js document.mdd')
    console.error('  node preview.js document.mdd preview.html')
    console.error('  node preview.js --strict document.mdd')
    process.exit(1)
  }

  const inputPath = resolve(fileArgs[0])
  const inputBasename = basename(inputPath, '.mdd')
  const outputPath = fileArgs[1]
    ? resolve(fileArgs[1])
    : resolve(dirname(inputPath), `${inputBasename}.html`)

  try {
    // Read file content
    const fileContent = await readFile(inputPath, 'utf-8')
    const metadata = extractMetadata(fileContent)

    // Validate document
    let validationResult = null
    if (!skipValidation) {
      console.log(`Validating: ${inputPath}`)
      validationResult = validateDocument(fileContent, {
        validateFrontmatterFlag: true,
        validateDirectivesFlag: true,
        validateRequirementsFlag: true,
        validateClassesFlag: true,
        strict,
      })

      // Display validation summary
      if (validationResult.errors.length > 0) {
        console.error(`✗ Validation failed with ${validationResult.errors.length} error(s)`)
        for (const error of validationResult.errors.slice(0, 3)) {
          console.error(`  - [${error.code}] ${error.message}`)
        }
        if (validationResult.errors.length > 3) {
          console.error(`  ... and ${validationResult.errors.length - 3} more error(s)`)
        }
        console.error('')
      }

      if (validationResult.warnings.length > 0) {
        console.warn(`⚠ ${validationResult.warnings.length} warning(s) found`)
        if (strict) {
          console.error('Strict mode: treating warnings as errors')
          process.exit(2)
        }
      }

      if (validationResult.errors.length === 0 && validationResult.warnings.length === 0) {
        console.log('✓ Validation passed')
      }
    }

    // Process markdown
    console.log(`Processing: ${inputPath}`)
    const htmlContent = await processMarkdown(inputPath)

    // Generate complete HTML document with validation report
    const fullHtml = generateHtml(htmlContent, metadata, validationResult, { strict })

    // Write output
    await writeFile(outputPath, fullHtml, 'utf-8')
    console.log(`✓ Preview generated: ${outputPath}`)
    console.log(`  Open in browser: file://${outputPath}`)

    // Exit with error code if validation failed but preview was still generated
    if (validationResult && validationResult.errors.length > 0) {
      console.error('\nWarning: Preview generated despite validation errors')
      process.exit(1)
    }
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

void main()

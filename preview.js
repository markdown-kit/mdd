#!/usr/bin/env node
/**
 * MDD Preview Renderer CLI
 * Converts .mdd files to HTML for browser preview with validation
 */

import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname, basename } from 'node:path'

import { validateDocument } from '@markdownkit/remark-mdd/validator'

import { generateMddHtml } from './lib/preview-core.js'

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

    // Validate document
    let validationResult = null
    if (!skipValidation) {
      console.log(`Validating: ${inputPath}`)
      const normalizedContent = fileContent.replace(/\r\n/g, '\n')
      validationResult = validateDocument(normalizedContent, {
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

    // Process markdown into a complete, self-contained HTML document.
    // generateMddHtml is the single canonical renderer (escaped output,
    // language-aware) shared with the LSP and programmatic consumers.
    console.log(`Processing: ${inputPath}`)
    const fullHtml = await generateMddHtml(fileContent, { filePath: inputPath })

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

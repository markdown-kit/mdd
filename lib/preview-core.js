/**
 * MDD Preview Core
 *
 * Shared rendering functions for MDD document preview.
 * Used by the CLI preview tool and the LSP server.
 */

import remarkMddDocumentStructure from '@markdownkit/remark-mdd/plugins/document-structure'
import remarkMddTextFormatting from '@markdownkit/remark-mdd/plugins/text-formatting'
import { validateDocument } from '@markdownkit/remark-mdd/validator'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'

/**
 * Process MDD content string through the remark pipeline and convert LaTeX directives to HTML.
 *
 * @param {string} content - Raw MDD file content
 * @returns {Promise<string>} HTML body content
 */
export async function processContent(content) {
  const result = await remark()
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkGfm)
    .use(remarkMddDocumentStructure)
    .use(remarkMddTextFormatting)
    .use(remarkHtml, { sanitize: false })
    .process(content)

  let html = String(result)

  html = html.replace(
    /\\begin\{letterhead\}([\s\S]*?)\\end\{letterhead\}/g,
    '<div class="letterhead">$1</div>',
  )
  html = html.replace(/\\begin\{header\}([\s\S]*?)\\end\{header\}/g, '<div class="header">$1</div>')
  html = html.replace(/\\begin\{footer\}([\s\S]*?)\\end\{footer\}/g, '<div class="footer">$1</div>')
  html = html.replace(
    /\\begin\{contactinfo\}([\s\S]*?)\\end\{contactinfo\}/g,
    '<div class="contactinfo">$1</div>',
  )
  html = html.replace(
    /\\begin\{signature\}([\s\S]*?)\\end\{signature\}/g,
    '<div class="signature">$1</div>',
  )
  html = html.replace(/\\newpage/g, '<div class="page-break"></div>')
  html = html.replace(/\\sectionbreak/g, '<hr class="section-break">')

  return html
}

/**
 * Extract frontmatter metadata from MDD content.
 *
 * @param {string} content - Raw MDD file content
 * @returns {Record<string, string>} Parsed metadata key-value pairs
 */
export function extractMetadata(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return {}

  const metadata = {}
  const lines = frontmatterMatch[1].split('\n')

  for (const line of lines) {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length) {
      const value = valueParts
        .join(':')
        .trim()
        .replace(/^["']|["']$/g, '')
      metadata[key.trim()] = value
    }
  }

  return metadata
}

/**
 * Generate validation report HTML from a validation result.
 *
 * @param {object} validationResult - Result from validateDocument()
 * @returns {string} HTML string for the validation report section
 */
export function generateValidationReport(validationResult) {
  if (
    !validationResult ||
    (validationResult.errors.length === 0 && validationResult.warnings.length === 0)
  ) {
    return ''
  }

  let report = '<div class="validation-report">'

  if (validationResult.errors.length > 0) {
    report += '<div class="validation-errors">'
    report += `<h3>⚠️ Validation Errors (${validationResult.errors.length})</h3>`
    report += '<ul>'
    for (const error of validationResult.errors) {
      report += '<li class="error-item">'
      report += `<strong>[${error.code}]</strong> ${error.message}`
      if (error.location && Object.keys(error.location).length > 0) {
        const locParts = []
        if (error.location.line) locParts.push(`line ${error.location.line}`)
        if (error.location.directive) locParts.push(`directive ::${error.location.directive}`)
        if (error.location.field) locParts.push(`field "${error.location.field}"`)
        if (locParts.length > 0) {
          report += ` <em>(${locParts.join(', ')})</em>`
        }
      }
      if (error.suggestion) {
        report += `<div class="suggestion">💡 ${error.suggestion}</div>`
      }
      report += '</li>'
    }
    report += '</ul></div>'
  }

  if (validationResult.warnings.length > 0) {
    report += '<div class="validation-warnings">'
    report += `<h3>⚠️ Validation Warnings (${validationResult.warnings.length})</h3>`
    report += '<ul>'
    for (const warning of validationResult.warnings) {
      report += '<li class="warning-item">'
      report += `<strong>[${warning.code}]</strong> ${warning.message}`
      if (warning.location && Object.keys(warning.location).length > 0) {
        const locParts = []
        if (warning.location.line) locParts.push(`line ${warning.location.line}`)
        if (warning.location.directive) locParts.push(`directive ::${warning.location.directive}`)
        if (warning.location.field) locParts.push(`field "${warning.location.field}"`)
        if (locParts.length > 0) {
          report += ` <em>(${locParts.join(', ')})</em>`
        }
      }
      if (warning.suggestion) {
        report += `<div class="suggestion">💡 ${warning.suggestion}</div>`
      }
      report += '</li>'
    }
    report += '</ul></div>'
  }

  report += '</div>'
  return report
}

/** CSS for MDD document preview */
export const MDD_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #333; background: #f5f5f5; padding: 2rem; }
.document-container { max-width: 8.5in; margin: 0 auto; background: white; padding: 1in; box-shadow: 0 2px 8px rgba(0,0,0,0.1); min-height: 11in; }
.letterhead { text-align: center; border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 2rem; font-weight: bold; }
.header { text-align: center; font-size: 10pt; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; margin-bottom: 2rem; }
.footer { text-align: center; font-size: 9pt; color: #666; border-top: 1px solid #ddd; padding-top: 0.5rem; margin-top: 2rem; }
.contactinfo { background: #f9f9f9; border: 1px solid #ddd; padding: 1rem; margin: 1rem 0; font-size: 10pt; }
.signature { margin-top: 3rem; page-break-inside: avoid; }
h1 { font-size: 20pt; margin: 2rem 0 1rem 0; color: #000; text-align: center; }
h2 { font-size: 14pt; margin: 1.5rem 0 0.75rem 0; color: #000; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem; }
h3 { font-size: 12pt; margin: 1rem 0 0.5rem 0; color: #333; }
p { margin: 0.75rem 0; text-align: justify; }
ul, ol { margin: 0.75rem 0; padding-left: 2rem; }
li { margin: 0.25rem 0; }
table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 11pt; }
th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
th { background: #f5f5f5; font-weight: bold; }
tr:nth-child(even) { background: #fafafa; }
tr:has(strong) { font-weight: bold; background: #f0f0f0; }
blockquote { border-left: 4px solid #ddd; padding-left: 1rem; margin: 1rem 0; color: #666; font-style: italic; }
strong { font-weight: bold; color: #000; }
em { font-style: italic; }
hr { border: none; border-top: 1px solid #ccc; margin: 2rem 0; }
sup, sub { font-size: 75%; line-height: 0; position: relative; vertical-align: baseline; }
sup { top: -0.5em; }
sub { bottom: -0.25em; }
a { color: #0066cc; text-decoration: none; }
a:hover { text-decoration: underline; }
.invoice-title { text-align: center; font-size: 24pt; margin: 1rem 0; }
.contract-title { text-align: center; font-size: 18pt; margin: 2rem 0; }
.legal-notice { background: #fffacd; border: 1px solid #f0e68c; padding: 0.5rem; margin: 1rem 0; }
.metadata { font-size: 10pt; color: #666; margin-bottom: 2rem; padding: 1rem; background: #f9f9f9; border-left: 4px solid #0066cc; }
.metadata dt { font-weight: bold; display: inline; }
.metadata dd { display: inline; margin-left: 0.5rem; }
.metadata dd::after { content: ""; display: block; margin-bottom: 0.25rem; }
.validation-report { background: #fff3cd; border: 2px solid #ffc107; border-radius: 4px; padding: 1rem; margin: 1rem 0 2rem 0; font-size: 10pt; }
.validation-errors { margin-bottom: 1rem; }
.validation-errors h3 { color: #721c24; background: #f8d7da; padding: 0.5rem; margin: 0 -1rem 0.5rem -1rem; font-size: 11pt; }
.validation-warnings h3 { color: #856404; background: #fff3cd; padding: 0.5rem; margin: 0 -1rem 0.5rem -1rem; font-size: 11pt; }
.validation-report ul { list-style: none; padding: 0; margin: 0; }
.error-item, .warning-item { background: white; border-left: 4px solid #dc3545; padding: 0.5rem; margin: 0.5rem 0; }
.warning-item { border-left-color: #ffc107; }
.error-item strong, .warning-item strong { font-family: 'Monaco', 'Courier New', monospace; font-size: 9pt; }
.error-item strong { color: #721c24; }
.warning-item strong { color: #856404; }
.error-item em, .warning-item em { color: #6c757d; font-size: 9pt; }
.suggestion { color: #004085; background: #d1ecf1; padding: 0.25rem 0.5rem; margin-top: 0.25rem; border-radius: 3px; font-size: 9pt; }
@media print { body { background: white; padding: 0; } .document-container { box-shadow: none; padding: 0; margin: 0; } .page-break { page-break-after: always; } }
`

/**
 * Generate a self-contained HTML document from MDD content.
 *
 * @param {string} content - Raw MDD file content
 * @returns {Promise<string>} Complete self-contained HTML document
 */
export async function generateMddHtml(content) {
  const metadata = extractMetadata(content)

  let validationResult = null
  try {
    validationResult = validateDocument(content, {
      validateFrontmatterFlag: true,
      validateDirectivesFlag: true,
      validateRequirementsFlag: true,
      validateClassesFlag: true,
      strict: false,
    })
  } catch {
    // Validation failure shouldn't block preview rendering
  }

  const htmlContent = await processContent(content)

  let metadataHtml = ''
  if (metadata.title || metadata.date || metadata.author) {
    metadataHtml = '<div class="metadata"><dl>'
    if (metadata.title) metadataHtml += `<dt>Title:</dt><dd>${metadata.title}</dd>`
    if (metadata.date) metadataHtml += `<dt>Date:</dt><dd>${metadata.date}</dd>`
    if (metadata.author) metadataHtml += `<dt>Author:</dt><dd>${metadata.author}</dd>`
    if (metadata['document-type'])
      metadataHtml += `<dt>Type:</dt><dd>${metadata['document-type']}</dd>`
    metadataHtml += '</dl></div>'
  }

  const validationHtml =
    validationResult && (validationResult.errors.length > 0 || validationResult.warnings.length > 0)
      ? generateValidationReport(validationResult)
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
    ${htmlContent}
  </div>
</body>
</html>`
}

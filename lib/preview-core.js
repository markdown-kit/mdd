/**
 * MDD Preview Core
 *
 * Shared rendering functions for MDD document preview.
 * Used by the CLI preview tool and the LSP server.
 */

import remarkMddDocumentStructure from '@markdownkit/remark-mdd/plugins/document-structure'
import remarkMddTextFormatting from '@markdownkit/remark-mdd/plugins/text-formatting'
import { extractFrontmatter, validateDocument } from '@markdownkit/remark-mdd/validator'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'

/**
 * Escape a value for safe interpolation into HTML text/attribute context.
 * Frontmatter and validation messages originate from user content and must not
 * be injected raw into the generated document.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * GFM options for MDD content. Single-tilde strikethrough is disabled because
 * MDD reserves `text~sub~` for subscripts; only `~~text~~` is strikethrough.
 */
export const MDD_GFM_OPTIONS = { singleTilde: false }

/**
 * Process MDD content string through the remark pipeline into an HTML body.
 * Directives become semantic `<div>` containers via the document-structure plugin.
 *
 * @param {string} content - Raw MDD file content
 * @param {{ filePath?: string }} [options] - Preview generation options
 * @returns {Promise<string>} HTML body content
 */
export async function processContent(content, options = {}) {
  const filePath = options.filePath ?? 'preview.mdd'
  const result = await remark()
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkGfm, MDD_GFM_OPTIONS)
    .use(remarkMddDocumentStructure)
    .use(remarkMddTextFormatting)
    .use(remarkHtml, { sanitize: false })
    .process({ value: content, path: filePath })

  return String(result)
}

/**
 * Extract frontmatter metadata from MDD content.
 *
 * Delegates to the canonical remark-mdd frontmatter parser so metadata is read
 * exactly the same way validation reads it (real YAML: CRLF, block lists,
 * typed scalars) — no second, divergent parser.
 *
 * @param {string} content - Raw MDD file content
 * @returns {Record<string, unknown>} Parsed metadata key-value pairs
 */
export function extractMetadata(content) {
  return extractFrontmatter(content) ?? {}
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

  // Render one issue's list item with every user-controlled value escaped.
  const renderIssue = (issue, itemClass) => {
    let html = `<li class="${itemClass}">`
    html += `<strong>[${escapeHtml(issue.code)}]</strong> ${escapeHtml(issue.message)}`
    if (issue.location && Object.keys(issue.location).length > 0) {
      const locParts = []
      if (issue.location.line) locParts.push(`line ${escapeHtml(issue.location.line)}`)
      if (issue.location.directive) {
        locParts.push(`directive ::${escapeHtml(issue.location.directive)}`)
      }
      if (issue.location.field) locParts.push(`field "${escapeHtml(issue.location.field)}"`)
      if (locParts.length > 0) {
        html += ` <em>(${locParts.join(', ')})</em>`
      }
    }
    if (issue.suggestion) {
      html += `<div class="suggestion">💡 ${escapeHtml(issue.suggestion)}</div>`
    }
    html += '</li>'
    return html
  }

  let report = '<div class="validation-report">'

  if (validationResult.errors.length > 0) {
    report += '<div class="validation-errors">'
    report += `<h3>⚠️ Validation Errors (${validationResult.errors.length})</h3>`
    report += '<ul>'
    for (const error of validationResult.errors) {
      report += renderIssue(error, 'error-item')
    }
    report += '</ul></div>'
  }

  if (validationResult.warnings.length > 0) {
    report += '<div class="validation-warnings">'
    report += `<h3>⚠️ Validation Warnings (${validationResult.warnings.length})</h3>`
    report += '<ul>'
    for (const warning of validationResult.warnings) {
      report += renderIssue(warning, 'warning-item')
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
.numbered-section, .document-section { break-inside: avoid; }
.subsection, .section-title { font-weight: bold; margin-top: 1rem; }
.long-paragraph { orphans: 3; widows: 3; }
.legal-clause, .numbered-item { padding-left: 1.5rem; text-indent: -1.5rem; }
.important, .warning, .note, .example, .quote-block { border-left: 4px solid #666; padding: 0.75rem 1rem; margin: 1rem 0; }
.important, .warning { background: #fff3cd; border-left-color: #b7791f; }
.note, .example { background: #eef6ff; border-left-color: #2b6cb0; }
.emphasis { font-weight: bold; }
.quote-block { color: #555; font-style: italic; }
.signature-line, .witness-line, .notary-line { display: inline-block; min-width: 16rem; border-bottom: 1px solid #333; padding-top: 2rem; }
.party-name { font-weight: bold; }
.effective-date, .expiration-date, .date-line { font-variant-numeric: tabular-nums; }
.payment-terms { break-inside: avoid; }
.total-amount, .subtotal, .tax, .total, .item-quantity, .item-price { text-align: right; font-variant-numeric: tabular-nums; }
.total-amount, .total { font-weight: bold; border-top: 2px solid #333; }
.item-description { text-align: left; }
.footer-note, .page-number, .copyright-notice { color: #666; font-size: 9pt; }
.confidential-notice { text-align: center; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em; }
.recipient-address, .sender-address { white-space: pre-line; }
.subject-line { font-weight: bold; }
.salutation, .closing { margin-top: 1.5rem; }
.enclosure, .cc-line, .reference-number { font-size: 10pt; }
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
@page { margin: 1in; }
@media print { body { background: white; padding: 0; } .document-container { box-shadow: none; padding: 0; margin: 0; max-width: none; min-height: 0; } .page-break { page-break-after: always; } }
`

/**
 * Generate a self-contained HTML document from MDD content.
 *
 * @param {string} content - Raw MDD file content
 * @param {{ filePath?: string, validate?: boolean }} [options] - Preview generation options.
 *   `validate` (default true) controls whether the validation report is computed and embedded.
 * @returns {Promise<string>} Complete self-contained HTML document
 */
export async function generateMddHtml(content, options = {}) {
  const metadata = extractMetadata(content)

  let validationResult = null
  if (options.validate ?? true) {
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
  }

  const htmlContent = await processContent(content, options)

  let metadataHtml = ''
  if (metadata.title || metadata.date || metadata.author) {
    metadataHtml = '<div class="metadata"><dl>'
    if (metadata.title) metadataHtml += `<dt>Title:</dt><dd>${escapeHtml(metadata.title)}</dd>`
    if (metadata.date) metadataHtml += `<dt>Date:</dt><dd>${escapeHtml(metadata.date)}</dd>`
    if (metadata.author) metadataHtml += `<dt>Author:</dt><dd>${escapeHtml(metadata.author)}</dd>`
    if (metadata['document-type'])
      metadataHtml += `<dt>Type:</dt><dd>${escapeHtml(metadata['document-type'])}</dd>`
    metadataHtml += '</dl></div>'
  }

  const validationHtml =
    validationResult && (validationResult.errors.length > 0 || validationResult.warnings.length > 0)
      ? generateValidationReport(validationResult)
      : ''

  // Honor the document language (ISO 639-1) so non-English documents are
  // announced correctly to browsers/screen readers/PDF tooling.
  const lang =
    typeof metadata.language === 'string' && /^[a-z]{2}(-[A-Z]{2})?$/.test(metadata.language)
      ? metadata.language
      : 'en'
  const title =
    typeof metadata.title === 'string' && metadata.title.length > 0
      ? escapeHtml(metadata.title)
      : 'MDD Document Preview'

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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

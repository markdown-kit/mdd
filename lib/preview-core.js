/**
 * MDD Preview Core
 *
 * Shared rendering functions for MDD document preview.
 * Used by the CLI preview tool and the LSP server.
 */

import { readFileSync } from 'node:fs'

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

/**
 * The document stylesheet, from lib/mdd.css, which is also exported as
 * `@markdownkit/mdd/mdd.css` for renderers outside this package.
 */
export const MDD_CSS = readFileSync(new URL('./mdd.css', import.meta.url), 'utf8')

/** Styles for the preview's own furniture: the metadata box and the validation report. */
export const PREVIEW_CSS = `
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
`

/**
 * Generate a self-contained HTML document from MDD content.
 *
 * @param {string} content - Raw MDD file content
 * @param {{ filePath?: string, validate?: boolean, metadata?: boolean }} [options] - Preview generation options.
 *   `validate` (default true) controls whether the validation report is computed and embedded;
 *   `metadata` (default true) controls whether the Title/Date/Author/Type box is embedded.
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
  if ((options.metadata ?? true) && (metadata.title || metadata.date || metadata.author)) {
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
  <style>${MDD_CSS}${PREVIEW_CSS}</style>
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

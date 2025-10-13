#!/usr/bin/env node
/**
 * MDD Preview Renderer
 * Converts .mdd files to HTML for browser preview
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { remark } from 'remark';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import { read } from 'to-vfile';

// Import MDD plugins
import remarkMddDocumentStructure from './plugins/remark-mdd-document-structure.js';
import remarkMddTextFormatting from './plugins/remark-mdd-text-formatting.js';

/**
 * Process MDD file and convert to HTML
 */
async function processMarkdown(filePath) {
  const file = await read(filePath);

  // Force file path so plugins recognize it as .mdd
  if (!file.path) {
    file.path = filePath;
  }

  const result = await remark()
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkGfm)
    .use(remarkMddDocumentStructure)
    .use(remarkMddTextFormatting)
    .use(remarkHtml, { sanitize: false })
    .process(file);

  let html = String(result);

  // Convert LaTeX directives to HTML div elements for preview
  html = html.replace(/\\begin\{letterhead\}([\s\S]*?)\\end\{letterhead\}/g, '<div class="letterhead">$1</div>');
  html = html.replace(/\\begin\{header\}([\s\S]*?)\\end\{header\}/g, '<div class="header">$1</div>');
  html = html.replace(/\\begin\{footer\}([\s\S]*?)\\end\{footer\}/g, '<div class="footer">$1</div>');
  html = html.replace(/\\begin\{contactinfo\}([\s\S]*?)\\end\{contactinfo\}/g, '<div class="contactinfo">$1</div>');
  html = html.replace(/\\begin\{signature\}([\s\S]*?)\\end\{signature\}/g, '<div class="signature">$1</div>');
  html = html.replace(/\\newpage/g, '<div class="page-break"></div>');
  html = html.replace(/\\sectionbreak/g, '<hr class="section-break">');

  return html;
}

/**
 * Generate complete HTML document
 */
function generateHtml(content, metadata = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title || 'MDD Document Preview'}</title>
  <style>
    /* Business Document Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 2rem;
    }

    .document-container {
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
      padding: 1in;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      min-height: 11in;
    }

    /* Letterhead styling */
    .letterhead {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 1rem;
      margin-bottom: 2rem;
      font-weight: bold;
    }

    /* Header and Footer */
    .header {
      text-align: center;
      font-size: 10pt;
      color: #666;
      border-bottom: 1px solid #ddd;
      padding-bottom: 0.5rem;
      margin-bottom: 2rem;
    }

    .footer {
      text-align: center;
      font-size: 9pt;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 0.5rem;
      margin-top: 2rem;
    }

    /* Contact Info */
    .contactinfo {
      background: #f9f9f9;
      border: 1px solid #ddd;
      padding: 1rem;
      margin: 1rem 0;
      font-size: 10pt;
    }

    /* Signature Block */
    .signature {
      margin-top: 3rem;
      page-break-inside: avoid;
    }

    /* Headings */
    h1 {
      font-size: 20pt;
      margin: 2rem 0 1rem 0;
      color: #000;
      text-align: center;
    }

    h2 {
      font-size: 14pt;
      margin: 1.5rem 0 0.75rem 0;
      color: #000;
      border-bottom: 1px solid #ccc;
      padding-bottom: 0.25rem;
    }

    h3 {
      font-size: 12pt;
      margin: 1rem 0 0.5rem 0;
      color: #333;
    }

    /* Paragraphs */
    p {
      margin: 0.75rem 0;
      text-align: justify;
    }

    /* Lists */
    ul, ol {
      margin: 0.75rem 0;
      padding-left: 2rem;
    }

    li {
      margin: 0.25rem 0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 11pt;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 0.5rem;
      text-align: left;
    }

    th {
      background: #f5f5f5;
      font-weight: bold;
    }

    tr:nth-child(even) {
      background: #fafafa;
    }

    /* Bold rows for totals */
    tr:has(strong) {
      font-weight: bold;
      background: #f0f0f0;
    }

    /* Blockquotes */
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1rem;
      margin: 1rem 0;
      color: #666;
      font-style: italic;
    }

    /* Strong and emphasis */
    strong {
      font-weight: bold;
      color: #000;
    }

    em {
      font-style: italic;
    }

    /* Horizontal rules */
    hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 2rem 0;
    }

    /* Superscript and subscript */
    sup, sub {
      font-size: 75%;
      line-height: 0;
      position: relative;
      vertical-align: baseline;
    }

    sup {
      top: -0.5em;
    }

    sub {
      bottom: -0.25em;
    }

    /* Links */
    a {
      color: #0066cc;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    /* Semantic classes */
    .invoice-title {
      text-align: center;
      font-size: 24pt;
      margin: 1rem 0;
    }

    .contract-title {
      text-align: center;
      font-size: 18pt;
      margin: 2rem 0;
    }

    .legal-notice {
      background: #fffacd;
      border: 1px solid #f0e68c;
      padding: 0.5rem;
      margin: 1rem 0;
    }

    .numbered-section {
      counter-increment: section;
    }

    /* Page breaks for print */
    @media print {
      body {
        background: white;
        padding: 0;
      }

      .document-container {
        box-shadow: none;
        padding: 0;
        margin: 0;
      }

      .page-break {
        page-break-after: always;
      }
    }

    /* Metadata display */
    .metadata {
      font-size: 10pt;
      color: #666;
      margin-bottom: 2rem;
      padding: 1rem;
      background: #f9f9f9;
      border-left: 4px solid #0066cc;
    }

    .metadata dt {
      font-weight: bold;
      display: inline;
    }

    .metadata dd {
      display: inline;
      margin-left: 0.5rem;
    }

    .metadata dd::after {
      content: "";
      display: block;
      margin-bottom: 0.25rem;
    }
  </style>
</head>
<body>
  <div class="document-container">
    ${metadata.title || metadata.date || metadata.author ? `
    <div class="metadata">
      <dl>
        ${metadata.title ? `<dt>Title:</dt><dd>${metadata.title}</dd>` : ''}
        ${metadata.date ? `<dt>Date:</dt><dd>${metadata.date}</dd>` : ''}
        ${metadata.author ? `<dt>Author:</dt><dd>${metadata.author}</dd>` : ''}
        ${metadata['document-type'] ? `<dt>Type:</dt><dd>${metadata['document-type']}</dd>` : ''}
      </dl>
    </div>
    ` : ''}
    ${content}
  </div>
</body>
</html>`;
}

/**
 * Extract frontmatter metadata
 */
function extractMetadata(fileContent) {
  const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return {};

  const metadata = {};
  const lines = frontmatterMatch[1].split('\n');

  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      metadata[key.trim()] = value;
    }
  }

  return metadata;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node preview.js <input.mdd> [output.html]');
    console.error('');
    console.error('Examples:');
    console.error('  node preview.js document.mdd');
    console.error('  node preview.js document.mdd preview.html');
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const inputBasename = basename(inputPath, '.mdd');
  const outputPath = args[1] ? resolve(args[1]) : resolve(dirname(inputPath), `${inputBasename}.html`);

  try {
    // Read and extract metadata
    const fileContent = await readFile(inputPath, 'utf-8');
    const metadata = extractMetadata(fileContent);

    // Process markdown
    console.log(`Processing: ${inputPath}`);
    const htmlContent = await processMarkdown(inputPath);

    // Generate complete HTML document
    const fullHtml = generateHtml(htmlContent, metadata);

    // Write output
    await writeFile(outputPath, fullHtml, 'utf-8');
    console.log(`✓ Preview generated: ${outputPath}`);
    console.log(`  Open in browser: file://${outputPath}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

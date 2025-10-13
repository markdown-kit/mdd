# MDD: Comprehensive Technical Guide

## Project Context

**MDD (Markdown Document)** is a semantic document layer that bridges AI-generated markdown with professional business document output (HTML/PDF/DOCX). It preserves document structure and intent through a two-stage conversion architecture, making it the missing infrastructure for the AI-to-Office pipeline.

### Project Split (Important)

MDD was split from the **markdownfix** project to separate concerns:

- **[markdownfix](../markdownfix/)** - General-purpose markdown formatter/linter for developer documentation and web content (`.md`, `.mdx` files)
- **MDD** (this project) - Specialized business document format for professional print output (`.mdd` files only)

**Relationship**: The projects are separate but complementary. Use markdownfix for web content and developer docs; use MDD for invoices, proposals, contracts, and other business documents requiring professional PDF output.

## System Requirements

- **Node.js**: Version 22.0.0 or higher
- **Package manager**: pnpm (all commands use pnpm)

## Essential Commands

```bash
# Preview any .mdd document (generates .html file)
pnpm run preview <file.mdd>

# Quick preview shortcuts for examples
pnpm run preview:business-letter
pnpm run preview:invoice
pnpm run preview:greek
pnpm run preview:comprehensive

# Install dependencies
pnpm install

# Run tests
pnpm test
```

## Architecture Overview

### Semantic Document Processing

MDD's core innovation is semantic structure preservation across formats.

**Input**: Business document in `.mdd` format with minimal semantic markup (letterheads, signatures)
**Processing**: Two-stage conversion (Markdown → LaTeX markers → Output format)
**Output**: HTML (browser preview), PDF (final distribution), DOCX (collaborative editing)

**The Innovation**: Unlike traditional markdown processors that style text, MDD preserves document *intent*. A `::letterhead` directive maintains its semantic meaning whether converted to HTML, PDF, or DOCX—enabling consistent professional output across all formats.

### Processing Pipeline

```
Input: .mdd file
  ↓
1. remark-frontmatter: Parse YAML metadata
  ↓
2. remark-gfm: Handle tables, strikethrough, etc.
  ↓
3. remark-mdd-document-structure: Convert ::directives
  ↓
4. remark-mdd-text-formatting: Handle ^super^, ~sub~, @refs
  ↓
5. remark-html: Generate HTML (sanitize: false)
  ↓
Output: HTML with LaTeX-style markup
```

**Post-processing** (in preview.js):
- Convert `\begin{letterhead}...\end{letterhead}` → `<div class="letterhead">...</div>`
- Wrap in complete HTML document with professional business CSS
- Write `.html` file to same directory as input

## File Structure

```
mdd/
├── examples/                          # Example .mdd documents
│   ├── business-letter.mdd
│   ├── invoice.mdd
│   ├── greek-document.mdd
│   └── comprehensive-document.mdd
├── plugins/                           # Remark plugins
│   ├── remark-mdd-document-structure.js
│   ├── remark-mdd-text-formatting.js
│   └── remark-mdx-conditional.js      # Unused (kept for reference)
├── docs/                              # Documentation
│   ├── BUSINESS-DOCUMENTS.md
│   └── MDD-PREVIEW.md
├── preview.js                         # HTML preview generator
├── package.json                       # Dependencies and scripts
├── SPECIFICATION.md                   # MDD syntax specification
├── README.md                          # User-facing guide
├── CLAUDE.md                          # AI assistant context
├── CHANGELOG.md                       # Version history
└── COMPREHENSIVE-GUIDE.md             # This file
```

## Custom MDD Plugins

### remark-mdd-document-structure.js

**Purpose**: Handle document structure directives specific to business documents.

**Parses**:
- `::letterhead` ... `::` - Company header information
- `::header` ... `::` - Page headers (repeated on each page)
- `::footer` ... `::` - Page footers (repeated on each page)
- `::contact-info` ... `::` - Contact details block
- `::signature-block` ... `::` - Signature lines and dates
- `::page-break` `::` - Force page break (self-closing)
- `::: section-break :::` - Section divider
- `{.semantic-class}` - CSS class annotations

**Output**: LaTeX-style markup like `\begin{letterhead}...\end{letterhead}`

**Activation**: Only processes files ending in `.mdd`

**Key Function**: `createDocumentElement()` - Main switch statement for handling each directive type

### remark-mdd-text-formatting.js

**Purpose**: Professional typography and cross-referencing for business documents.

**Handles**:
- Superscripts: `text^super^` → `<sup>super</sup>`
- Subscripts: `text~sub~` → `<sub>sub</sub>`
- Internal references: `@section-1` → auto-linked section
- Automatic section numbering (1, 1.1, 1.1.1) for H1-H3
- Legal clause detection (WHEREAS, THEREFORE, etc.)
- Long paragraph detection

**Output**: Mixed node arrays (text + HTML + link nodes)

**Activation**: Only processes `.mdd` files

**Key Function**: `processTextFormatting()` - Regex matching and node replacement

### remark-mdx-conditional.js

**Status**: Unused in MDD project

**Purpose**: This plugin was for the markdownfix project to conditionally enable MDX parsing. MDD doesn't use MDX at all, so this plugin is not loaded.

## MDD Syntax Reference

### Document Metadata

```yaml
---
title: "Service Proposal"
date: "2024-12-15"
author: "Sales Department"
document-type: "business-proposal"
---
```

### Document Structure Directives

```markdown
::letterhead
ACME Corporation
123 Business Street
San Francisco, CA 94102
::

::header
ACME Corporation | Proposal | Page {{page}}
::

::footer
Confidential | © 2024 ACME Corporation
::

::contact-info
Phone: (555) 123-4567
Email: contact@acme.com
Website: www.acme.com
::

::signature-block
Signature: ____________________
Name: [Print name]
Date: ____________________
::

::page-break
::

::: section-break
:::
```

### Text Formatting

```markdown
Version 2.0^beta^ produces H~2~O via the process described in @section-2.

Cross-reference: See @table-1 and @figure-3 for details.
```

**Rendering**:
- `text^super^` → text<sup>super</sup>
- `text~sub~` → text<sub>sub</sub>
- `@section-X` → hyperlinked reference with "Section X" text

### Semantic Classes

```markdown
# Executive Summary {.document-section}
## Financial Results {.numbered-section}

Important legal text. {.legal-notice}
```

## MDD Philosophy

### Design Principles

1. **Minimal syntax**: Barely more than standard markdown—if you know markdown, you know 90% of MDD
2. **Semantic preservation**: Capture document *intent* (letterhead, signature), not just *appearance* (bold, centered)
3. **Multi-format output**: Single source → HTML (preview) + PDF (final) + DOCX (collaboration)
4. **AI workflow integration**: Designed for modern pipeline where AI generates markdown and businesses need professional documents
5. **Human-readable source**: Plain text files compatible with version control (Git)
6. **Zero configuration**: Professional styling built-in, no templates or CSS needed
7. **Print-focused**: Optimized for document output, not web content

### What MDD Is For

- Business letters and proposals
- Invoices and quotes
- Contracts and agreements
- Professional reports
- Legal documents
- Any document requiring professional PDF/DOCX output with semantic structure

### What MDD Is NOT For

- Developer documentation (use markdownfix)
- Web content or blogs (use markdownfix)
- Code-heavy docs (use markdownfix)
- Interactive web applications

## The AI Workflow Revolution

### The Problem MDD Solves

Modern content creation workflows have a critical gap:

**AI tools** (ChatGPT, Claude, Gemini, etc.) → Generate **markdown**
**Business needs** → Professional **PDF/DOCX** with proper formatting

**Current solution**: Manual copying to Word, reformatting letterheads, signatures, headers, footers—15-30 minutes per document.

**MDD solution**: AI generates markdown → Add semantic directives (30 seconds) → Professional document ready.

### Real-World Workflow Example

**Scenario**: Legal firm drafting client contract with AI assistance

**Traditional workflow (20-30 minutes):**
1. AI generates contract text in markdown
2. Copy/paste into Microsoft Word
3. Manually add firm letterhead
4. Manually format signature blocks
5. Manually create page headers/footers
6. Adjust margins and typography
7. Save as DOCX for client review
8. Client edits in Word
9. Export final version to PDF

**MDD workflow (< 2 minutes):**

1. AI generates contract text → save as `.mdd`
2. Add semantic directives:

   ```markdown
   ::letterhead
   Smith & Associates Law Firm
   123 Legal Street, Suite 400
   ::

   ::signature-block
   ____________________
   Attorney Name
   Date: ____________________
   ::
   ```

3. Run: `mdd-preview contract.mdd`
4. Print to PDF or convert to DOCX via pandoc
5. Professional document ready for client

**Time saved**: 18-28 minutes per document
**Quality**: Consistent professional formatting
**Collaboration**: DOCX output preserves editability

### Why This Matters

**Volume**: Law firms, consultancies, sales teams create dozens of documents daily
**Consistency**: Semantic directives ensure brand compliance
**Version Control**: Plain text source files work with Git
**AI Integration**: Native markdown input from AI tools

## Development Workflows

### Testing Changes

1. Create or modify an `.mdd` file in `examples/`
2. Run `pnpm run preview examples/your-file.mdd`
3. Open generated `.html` in browser
4. Verify rendering and print preview (Cmd/Ctrl+P)

**Note**: No automated test suite exists. All testing is manual.

### Adding New Directives

When adding a new `::directive`:

1. Add pattern to `STRUCTURE_PATTERNS` in `remark-mdd-document-structure.js` (around lines 18-28)
2. Implement `create<Directive>()` function following existing patterns
   - See `createLetterhead()` around line 219
   - See `createSignatureBlock()` around line 237
3. Add case to `createDocumentElement()` switch (around lines 174-202)
4. Add LaTeX → HTML conversion in `preview.js` (around lines 41-47)
5. Add CSS styling in `preview.js` (around lines 56-335)
6. Update `SPECIFICATION.md` with syntax example
7. Add example to an `.mdd` file in `examples/`

### Changing Text Formatting

When modifying text formatting (superscripts, subscripts, references):

1. Edit `TEXT_PATTERNS` regex in `remark-mdd-text-formatting.js`
2. Update `createFormattedNode()` function for new node types
3. Test with `examples/comprehensive-document.mdd`
4. Update `SPECIFICATION.md`

## Common Issues

### Directives Not Rendering

**Problem**: MDD directives show as plain text

**Causes**:
- File doesn't have `.mdd` extension
- Missing end marker (`::` on its own line)
- Blank lines inside directive block (splits it into multiple paragraphs)

**Solutions**:
- Ensure file ends in `.mdd`
- Check all directives have closing `::` marker
- Remove blank lines inside directive blocks

### Content Extraction Errors

**Problem**: Directive content is empty or incomplete

**Causes**:
- End marker in wrong place
- Multiple directive markers without proper closure

**Solutions**:
- Ensure each `::directive` has exactly one matching `::`
- Don't nest directives (not supported)
- Review `examples/business-letter.mdd` for correct patterns

### HTML Not Generated

**Problem**: Preview command succeeds but no HTML file created

**Causes**:
- Write permissions issue
- Invalid file path

**Solutions**:
- Check console output for error messages
- Verify you have write permissions in the directory
- Use absolute paths if relative paths fail

## Integration with Markdownfix

While MDD and markdownfix are separate projects, they share some concepts:

### Shared

- Both use Remark/Unified ecosystem
- Both use `remark-frontmatter` for YAML metadata
- Both use `remark-gfm` for tables and strikethrough
- Both use `unist-util-visit` for AST traversal

### Different

| Feature | markdownfix | MDD |
|---------|-------------|-----|
| **Purpose** | Web content, developer docs | Business documents |
| **File types** | `.md`, `.mdx` | `.mdd` only |
| **Configuration** | `.remarkrc.js` | Hardcoded in `preview.js` |
| **Linting** | Yes (40+ rules) | No |
| **Auto-fixing** | Yes | No |
| **Output** | Formatted markdown | HTML preview → PDF/DOCX |
| **MDX support** | Yes | No |

### When to Use Which

- **Use markdownfix** when:
  - Writing README files
  - Creating developer documentation
  - Building web content with React components (MDX)
  - Need consistent markdown formatting across a project

- **Use MDD** when:
  - Creating invoices or proposals
  - Writing business letters
  - Generating contracts
  - Need professional PDF output
  - Require semantic document structure

## Future Roadmap

Current status: Core syntax working, HTML preview functional

**Next priorities**:
1. Pandoc integration for PDF/DOCX conversion
2. Template variables (`{{variable}}`)
3. CLI tool for batch processing
4. npm package publication
5. VS Code extension

## Technical Decisions

### Why Remark?

- Plugin-based architecture allows clean separation
- AST manipulation preserves semantic structure
- Wide ecosystem compatibility
- Well-maintained and documented

### Why Intermediate LaTeX Format?

- Pandoc excels at LaTeX → PDF conversion
- Semantic markup (not just styling) enables high-quality output
- Professional document conventions built into LaTeX
- Clean separation between structure and presentation

### Why Not MDX?

- MDX is for React components in markdown (web-focused)
- MDD is for document structure (print-focused)
- Simpler mental model for business users
- Avoids JavaScript parsing conflicts with `^` and `~` syntax

### Why No `.remarkrc.js`?

- MDD is simpler: one input format, one output format
- Plugin chain is fixed and doesn't need configuration
- Easier to understand for non-technical users
- Less configuration overhead

## Key Files Reference

| File | Purpose |
|------|---------|
| `preview.js` | Main entry point, HTML generator |
| `plugins/remark-mdd-document-structure.js` | Directive processing |
| `plugins/remark-mdd-text-formatting.js` | Typography and references |
| `SPECIFICATION.md` | Complete MDD syntax spec |
| `README.md` | User-facing guide |
| `CLAUDE.md` | AI assistant context |
| `examples/*.mdd` | Working examples |

## Quick Troubleshooting Checklist

- [ ] File has `.mdd` extension?
- [ ] All directives have closing markers?
- [ ] No blank lines inside directive blocks?
- [ ] YAML frontmatter properly formatted?
- [ ] Node.js version ≥ 22.0.0?
- [ ] `pnpm install` completed successfully?
- [ ] Write permissions in output directory?

## Additional Resources

- **MDD Specification**: See `SPECIFICATION.md`
- **Examples**: See `examples/` directory
- **Preview Guide**: See `docs/MDD-PREVIEW.md`
- **Business Document Types**: See `docs/BUSINESS-DOCUMENTS.md`
- **Remark Documentation**: https://github.com/remarkjs/remark
- **Unified Documentation**: https://unifiedjs.com/
- **Pandoc Manual**: https://pandoc.org/MANUAL.html

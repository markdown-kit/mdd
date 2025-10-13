# MDD: Semantic Markdown for Professional Documents

**The missing document layer for the AI-to-Office pipeline.**

AI generates markdown. Businesses need professional PDFs and editable DOCX files. MDD is the semantic layer that preserves document structure (letterheads, signatures, legal formatting) while converting plain text into high-fidelity, professional documents.

Write once in plain text. Output to HTML, PDF, and DOCX. It's markdown for documents that matter.

## Key Features

- ✅ **Semantic Structure Preservation**: MDD doesn't just style your text; it understands it. Directives like `::letterhead` and `::signature-block` preserve the document's meaning, enabling high-fidelity conversion to PDF, DOCX, and other formats where structure is critical.

- ✅ **Multi-Format Output**: Single source, multiple targets. Write once in `.mdd` format and generate HTML (for web preview), PDF (for final distribution), or DOCX (for collaborative editing). The semantic layer ensures consistent professional quality across all formats.

- ✅ **AI Workflow Integration**: MDD is the missing link between AI content generation and professional document output. ChatGPT and Claude output markdown—MDD transforms it into boardroom-ready documents with proper letterheads, signatures, and legal formatting in seconds.

- ✅ **Zero Configuration Styling**: Professional business document styling is built-in. No CSS configuration, no template hunting, no styling decisions. 8.5" × 11" layouts with correct margins, professional typography, and business document conventions work out of the box.

- ✅ **Version Control Friendly**: Plain text source files work seamlessly with Git. Track changes, collaborate with teams, review diffs, and maintain document history—impossible with binary Word formats.

- ✅ **Zero-Dependency Output**: Generated HTML files are self-contained. Email them, share them, archive them. They render perfectly everywhere with no external dependencies.

- ✅ **Minimalist Syntax**: Barely more than standard markdown. The syntax is intentionally simple and human-readable, empowering anyone to create complex professional documents with plain text.

- ✅ **200+ Document Types Analyzed**: MDD is built on domain expertise—a comprehensive analysis of over 200 business document types across 15+ industries, from invoices and contracts to proposals and legal agreements.

## Installation

```bash
# Install globally via npm
npm install -g @entro314labs/mdd

# Or use with npx (no installation required)
npx mdd-preview document.mdd

# Or clone and use locally
git clone https://github.com/entro314-labs/mdd.git
cd mdd
pnpm install
```

## Quick Start

```bash
# Using global installation
mdd-preview document.mdd

# Using npx (no installation)
npx mdd-preview document.mdd

# Using local clone
pnpm run preview examples/business-letter.mdd

# Open the generated HTML in your browser
open document.html
```

## What You Can Create

MDD is ideal for any document where professional structure and formatting are essential.

- **Business Letters** - Formal correspondence with letterheads
- **Invoices & Quotes** - Professional billing documents
- **Proposals** - Service proposals with pricing tables and timelines
- **Contracts & Agreements** - Legal documents with signature blocks
- **Reports** - Executive summaries and findings
- **Memos** - Internal communications

See [examples/](examples/) for working examples and [docs/BUSINESS-DOCUMENTS.md](docs/BUSINESS-DOCUMENTS.md) for the complete catalog of 200+ analyzed document types.

## The AI → Professional Document Workflow

MDD solves a critical gap in modern business workflows:

**Traditional Workflow (15-30 minutes per document):**

```
1. AI generates markdown content
2. Copy/paste into Microsoft Word
3. Manually add company letterhead
4. Manually format signature blocks
5. Manually create headers and footers
6. Adjust margins and typography
7. Save as DOCX for client review
8. Client edits in Word
9. Export final version to PDF
```

**MDD Workflow (< 2 minutes):**

```
1. AI generates markdown → save as .mdd
2. Add ::letterhead and ::signature-block directives (30 seconds)
3. Run: mdd-preview document.mdd
4. Print to PDF or convert to DOCX (via pandoc)
5. Professional document ready for distribution
```

**Time saved:** 13-28 minutes per document
**Quality improvement:** Consistent professional formatting
**Workflow integration:** Preserves editability and collaboration capabilities

## MDD Syntax

MDD extends standard markdown with a few powerful, intuitive directives.

### Document Metadata

```yaml
---
title: "Service Proposal"
date: "2024-12-15"
author: "Sales Department"
document-type: "business-proposal"
---
```

### Semantic Structure Directives

```markdown
::letterhead
Company Name
123 Business Street
Phone: (555) 123-4567
::

::header
Document Title | Page Numbers
::

::footer
Confidential | © 2024 Company Name
::

::contact-info
Email: contact@company.com
Website: www.company.com
::

::signature-block
Signature: ____________________
Name: [Print name]
Date: ____________________
::

::page-break
::
```

### Standard Markdown

MDD supports all standard markdown, including headings, lists, tables, and links.

### Advanced Text Formatting

```markdown
Version 2.0^beta^ produces H~2~O via @section-2.

Cross-reference: See @table-1 and @figure-3 for details.
```

- **Superscripts**: `text^super^` → text<sup>super</sup>
- **Subscripts**: `text~sub~` → text<sub>sub</sub>
- **References**: `@section-1` → auto-linked section

## Project Structure

```
mdd/
├── plugins/                    # Remark plugins for semantic processing
│   ├── remark-mdd-document-structure.js
│   ├── remark-mdd-text-formatting.js
│   └── remark-mdx-conditional.js
├── examples/                   # Example documents
│   ├── business-letter.mdd
│   ├── invoice.mdd
│   └── comprehensive-document.mdd
├── docs/                       # Documentation
│   ├── MDD-PREVIEW.md
│   └── BUSINESS-DOCUMENTS.md
├── preview.js                  # The core HTML preview generator
├── SPECIFICATION.md            # Complete MDD syntax specification
├── package.json
└── README.md
```

## Commands

```bash
# Preview any document
pnpm run preview <file.mdd>

# Quick preview shortcuts
pnpm run preview:business-letter
pnpm run preview:invoice
pnpm run preview:greek
pnpm run preview:comprehensive

# Install dependencies
pnpm install

# Test
pnpm test
```

## The MDD Philosophy

**MDD is NOT for:**

- ❌ Developer documentation or code-heavy tutorials
- ❌ Web content, blogs, or personal websites
- ❌ Anything that isn't destined for a professional, document-centric format

**MDD IS for:**

- ✅ Documents that require a formal, semantic structure.
- ✅ Workflows where plain text or AI-generated markdown must be converted into professional PDFs.
- ✅ Business letters, invoices, contracts, proposals, reports, and memos.

## Technical Details

### The Semantic Bridge: How it Works

MDD uses a sophisticated two-stage process to ensure your document's meaning is preserved.

1. **Structural Parsing**: The `remark-mdd-document-structure` plugin identifies directives (`::letterhead`) and converts them into an intermediate LaTeX-style representation (`\begin{letterhead}`). This preserves the *semantic intent* of the block, not just its appearance.
2. **HTML Generation**: The `preview.js` script then replaces these semantic markers with styled HTML `<div>` wrappers, applying the print-first CSS to create the final, professional output.

This architecture is what allows MDD to target other high-fidelity formats like DOCX and native PDF in the future.

### Output Targets

- **HTML** - Browser preview with print-optimized CSS (current)
- **PDF** - Via browser print (Cmd/Ctrl+P → Save as PDF) or pandoc integration
- **DOCX** - Via pandoc integration (preserves editability for collaboration)

**Note:** The LaTeX intermediate format means pandoc integration is architecturally ready. DOCX conversion is primarily a matter of configuring the pandoc pipeline—the hard work of semantic preservation is already complete.

## MDD vs. Alternatives

| Feature | MDD | Microsoft Word | LaTeX | Google Docs |
|---------|-----|----------------|-------|-------------|
| **Plain text source** | ✅ Yes | ❌ Binary format | ✅ Yes | ❌ Cloud only |
| **Version control (Git)** | ✅ Native | ❌ Not supported | ✅ Native | ❌ Not supported |
| **Professional PDF output** | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Limited |
| **DOCX output** | ✅ Via pandoc | ✅ Native | ⚠️ Complex | ✅ Export |
| **Learning curve** | ✅ Minimal (markdown) | ⚠️ Moderate | ❌ Steep | ✅ Easy |
| **AI workflow integration** | ✅ Native | ❌ Manual copy/paste | ❌ Manual conversion | ❌ Manual copy/paste |
| **Zero configuration styling** | ✅ Built-in | ❌ Templates needed | ❌ Complex setup | ⚠️ Limited control |
| **Collaboration (editable)** | ✅ DOCX output | ✅ Native | ❌ Source only | ✅ Native |
| **Offline-first** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Online required |
| **Semantic structure** | ✅ Preserved | ⚠️ Styling only | ✅ Preserved | ⚠️ Styling only |

**MDD's unique advantage:** Combines the version control benefits of plain text with professional multi-format output (PDF + DOCX), while requiring minimal syntax and zero configuration.

## Documentation

- **[SPECIFICATION.md](SPECIFICATION.md)** - The complete MDD syntax specification.
- **[docs/MDD-PREVIEW.md](docs/MDD-PREVIEW.md)** - A guide to the preview renderer.
- **[docs/BUSINESS-DOCUMENTS.md](docs/BUSINESS-DOCUMENTS.md)** - Our catalog of over 200 analyzed business document types.

## Roadmap

- [x] Core MDD syntax (directives, formatting)
- [x] HTML preview renderer with print-first CSS
- [x] Business document examples
- [x] npm package publication & CLI tool
- [ ] Pandoc integration for native PDF/DOCX output
- [ ] Template variables (`{{variable}}`)
- [ ] Batch processing features
- [ ] VS Code extension for live preview

## Entro314 Labs Markdown Ecosystem

MDD is part of a comprehensive markdown ecosystem. For complete documentation, see [PROJECT_ECOSYSTEM.md](../PROJECT_ECOSYSTEM.md).

### Companion Projects

#### 📝 [markdownfix](https://github.com/entro314-labs/markdownfix)

Opinionated formatter and linter for developer documentation:

- README files and technical docs
- Blog posts and GitHub wikis
- MDX files with React components
- 40+ comprehensive linting rules
- CLI tool: `markdownfix format`

**Installation**: `npm install -g @entro314labs/markdownfix`

markdownfix can **optionally format `.mdd` files** by installing MDD as a dependency.

#### 🖥️ [Anasa](https://github.com/entro314-labs/anasa)

Desktop knowledge management application with MDD integration:

- Bidirectional linking and graph visualization
- TipTap WYSIWYG editor
- **First GUI editor for MDD format**
- Create professional business documents inside your knowledge base
- Live preview and PDF export

**Status**: MDD integration planned ([see integration spec](../anasa/MDD_INTEGRATION_SPEC.md))

### When to Use Which

| Document Type | Use | File Extension | Package |
|---------------|-----|----------------|---------|
| README files | markdownfix | `.md` | `@entro314labs/markdownfix` |
| Technical documentation | markdownfix | `.md` | `@entro314labs/markdownfix` |
| Blog posts | markdownfix | `.md` / `.mdx` | `@entro314labs/markdownfix` |
| React component docs | markdownfix | `.mdx` | `@entro314labs/markdownfix` |
| **Business letters** | **MDD** | **`.mdd`** | **`@entro314labs/mdd`** |
| **Invoices** | **MDD** | **`.mdd`** | **`@entro314labs/mdd`** |
| **Proposals** | **MDD** | **`.mdd`** | **`@entro314labs/mdd`** |
| **Contracts** | **MDD** | **`.mdd`** | **`@entro314labs/mdd`** |
| Knowledge base + business docs | Anasa + MDD | `.md` + `.mdd` | Desktop app |

## Contributing

Contributions should focus on enhancing the core mission: preserving document semantics and producing high-quality, professional output. Please prioritize business document use cases and help us keep the syntax minimal and intuitive.

## License

MIT

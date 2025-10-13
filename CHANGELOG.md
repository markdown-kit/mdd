# Changelog

All notable changes to the MDD (Markdown Document) project.

## [0.0.5] - 2025-10-13

### Added

- Initial release of MDD format
- Core document structure directives:
  - `::letterhead` - Company headers with contact info
  - `::header` - Page headers with titles
  - `::footer` - Page footers with notices
  - `::contact-info` - Structured contact details
  - `::signature-block` - Signature areas
  - `::page-break` - Hard page breaks
- Text formatting features:
  - Superscripts: `text^super^`
  - Subscripts: `text~sub~`
  - Internal references: `@section-1`
- HTML preview renderer with professional styling
- Example documents:
  - Business proposal letter
  - Professional invoice
  - Greek language document
  - Comprehensive feature showcase
- Documentation:
  - Complete MDD specification
  - Preview guide
  - Business document types catalog (200+ examples)
- Remark plugins:
  - `remark-mdd-document-structure` - Process directives
  - `remark-mdd-text-formatting` - Handle typography
  - `remark-mdx-conditional` - Conditional MDX processing
- Automated test suite for all example documents
- npm package metadata (repository, bugs, homepage)

### Features

- Multi-paragraph directive support (handles blank lines)
- Formatted content support (bold, italic within directives)
- GitHub Flavored Markdown compatibility
- Print-ready HTML output (8.5" × 11")
- Professional typography and styling

### Known Limitations

- Template variables (`{{variable}}`) shown as-is (not replaced)
- PDF/DOCX output requires pandoc (not yet integrated)
- No live preview server

## Roadmap

### [0.2.0] - Planned

- Pandoc integration for PDF/DOCX export
- Template variable replacement
- CLI tool for batch processing

### [0.3.0] - Planned

- npm package publication
- Global CLI installation
- VS Code extension

### [1.0.0] - Planned

- Stable API
- Complete documentation
- Production-ready

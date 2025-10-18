# Changelog

All notable changes to the MDD (Markdown Document) project.

## [Unreleased]

### Added

- **Comprehensive Validation System**
  - JSON Schema for MDD documents ([schema/mdd-document.schema.json](schema/mdd-document.schema.json))
  - Document type requirements schema ([schema/document-type-requirements.json](schema/document-type-requirements.json))
  - TypeScript type definitions ([types/mdd.d.ts](types/mdd.d.ts))
  - Standalone CLI validation tool (`mdd-validate`)
  - Validation library ([lib/validator.js](lib/validator.js))
  - Plugin validation utilities ([lib/plugin-validator.js](lib/plugin-validator.js))

- **Validation Features**
  - Frontmatter schema validation (required fields, date formats, document types)
  - Directive structure validation (end markers, empty directives, nesting)
  - Document type-specific requirements (per-type required/recommended elements)
  - Semantic class whitelist validation
  - Detailed error messages with line numbers and suggestions
  - Error code system for programmatic handling

- **CLI Tools**
  - `mdd-validate` - Standalone validation with colored terminal output
  - `--strict` mode - Treat warnings as errors
  - `--json` output - Machine-readable validation reports
  - `--verbose` mode - Show directive summaries
  - Multi-file validation support
  - Exit codes (0=valid, 1=errors, 2=warnings in strict mode)

- **Integration Features**
  - Validation integrated into `preview.js` (enabled by default)
  - Validation report displayed in generated HTML
  - `--no-validate` flag for faster preview generation
  - `--strict` flag for preview generation

- **Documentation**
  - Comprehensive validation guide ([docs/VALIDATION.md](docs/VALIDATION.md))
  - Error codes reference
  - CI/CD integration examples
  - JSON Schema usage examples
  - TypeScript integration guide

- **Testing**
  - Comprehensive validation test suite ([test/validation-tests.js](test/validation-tests.js))
  - 20 test cases covering all validation features
  - Edge case testing (leap years, invalid dates, etc.)
  - 100% test pass rate

- **npm Scripts**
  - `validate` - Validate documents
  - `validate:all` - Validate all example documents
  - `validate:strict` - Strict validation mode
  - `test:validation` - Run validation test suite

### Changed

- Updated `package.json` with validation keywords and bin entries
- Enhanced README with validation section
- Updated roadmap to mark validation features as complete
- Improved frontmatter extraction to handle quoted values properly

### Fixed

- Frontmatter parsing now correctly handles quoted YAML values
- Added missing document types: `business-proposal`, `legal-contract`

## \[0.0.5] - 2025-10-13

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

### \[0.2.0] - Planned

- Pandoc integration for PDF/DOCX export
- Template variable replacement
- CLI tool for batch processing

### \[0.3.0] - Planned

- npm package publication
- Global CLI installation
- VS Code extension

### \[1.0.0] - Planned

- Stable API
- Complete documentation
- Production-ready

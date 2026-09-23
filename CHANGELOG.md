# Changelog

All notable changes to the MDD (Markdown Document) project.

## [Unreleased]

### Added

- **The print stylesheet is a file.** `lib/mdd.css` is exported as `@markdownkit/mdd/mdd.css`, so a renderer outside this package (notdocs, a docs site) can ship the same document styles instead of a copy. `MDD_CSS` from `./preview` is that file's text; the preview's own furniture (metadata box, validation report) moved to `PREVIEW_CSS`.

### Fixed

- **PDF without an installed Chrome failed with Puppeteer's raw error.** `puppeteer.executablePath()` returns a Promise that was never awaited, so the check never ran; `mdd-convert` now awaits it and checks the executable exists, and reports how to install the browser.
- **DOCX rewrote `~` and `^` inside code and URLs.** The `^sup^`/`~sub~` conversion ran on raw lines, so `` `ls ~a~` `` and links such as `https://example.com/~user/~x` came out with `<sub>` runs and broken targets; inline code spans, link/image destinations, autolinks and bare URLs are now copied verbatim.
- **DOCX/PDF headers and footers lost literal underscores.** Every `_` and `*` was deleted from `:::header`/`:::footer` text (`INV_2024_001` became `INV2024001`); only paired emphasis, strikethrough and code markers are removed now.
- **`status: review`, `sent`, `accepted` and `declined` were rejected.** `docs/VALIDATION.md` lists nine status values but the package allowed `@markdownkit/remark-mdd` 4.0.0, which accepts five; it now requires `^4.1.0`.
- **`mdd-validate --strict` with several files could exit 2 despite errors.** The highest exit code won, so a file with warnings hid another file's errors; the exit code is now 1 when any file has errors, else 2 when strict mode found warnings.
- **`mdd-migrate` converted CRLF line endings to LF.** Every line of a rewritten file came back with `\n`; each line now keeps its original ending.
- **`mdd-convert` HTML and PDF still printed the preview's metadata box** (Title/Date/Author/Type). `generateMddHtml` takes `metadata: false`, which `mdd-convert` passes; `mdd-preview` keeps the box.
- **Validation locations used the MDD 2 spelling.** `mdd-validate` and the preview's validation report printed `directive ::header`; they now print `:::header` for blocks and `::page-break` / `::section-break` for self-closing directives, matching remark-mdd's messages (also in the `--verbose` directive summary).

## [4.0.0] - 2026-09-16

### Changed

- **MDD 3 directive syntax.** Block directives are written `:::letterhead` … `:::`, self-closing ones `::page-break` and `::section-break`. The examples, the README and the specification use it. `mdd-convert` reads both spellings.

### Added

- `mdd-migrate <file.mdd> [...]` rewrites MDD 2 documents (`::name` … `::`, `::page-break ::`, `::: section-break :::`) into the MDD 3 spelling in place; `--check` exits 1 when a file would change, `--stdout` prints instead of writing. Also exported as `@markdownkit/mdd/migrate`.

### Deprecated

- The MDD 2 spelling. It is read for this major version with a `LEGACY_DIRECTIVE_SYNTAX` warning from the validator and is removed in the next.

### Fixed

- **Subscripts rendered as strikethrough.** `remark-gfm` parsed `H~2~O` as single-tilde strikethrough before the MDD typography plugin ran; the preview/PDF pipeline now uses `singleTilde: false` so `~x~` is a subscript (example documents regenerated).
- **DOCX lost `::header`/`::footer`.** They were passed as top-level options that `@markdownkit/md-docx` never reads; they are now real page headers/footers via `template`, and `{{page}}` renders a live page-number field; md-docx's default page numbering still applies to footers without the token.
- **DOCX block tokens merged into paragraphs.** `\pagebreak`/`---` emitted directly after a text line became paragraph text or a setext heading; they are now always separated by a blank line.
- **PDF printed with zero margins** and embedded the preview's validation-report/metadata boxes. `@page { margin: 1in }` plus 1in Puppeteer margins; `mdd-convert` outputs (PDF/HTML) omit the validation report.
- `mdd-preview --no-validate` now actually skips validation (`generateMddHtml` accepts `validate: false`).
- **PDF page furniture.** `::header`/`::footer` are printed on every PDF page (Chrome header/footer templates) with `{{page}}` as the live page number, instead of once inline with a literal `{{page}}`.
- **DOCX typography.** `^sup^` and `~sub~` are carried into Word as real super/subscript runs instead of literal markers.
- `@table-N` / `@figure-N` references now resolve to anchors on tables and images.
- **HTML preview showed `{{page}}` literally.** `::header`/`::footer` now render the token as `<span class="page-number">1</span>`.
- **Validator accepted directive openers the renderer could not see.** An opener directly after prose, a list item, a table row or a previous `::` is now a `DIRECTIVE_NOT_BLOCK_START` error (see SPECIFICATION.md).

### Removed

- Dead LaTeX-marker post-processing in `processContent`; directives are emitted as HTML containers by the plugin.

### Added

- **Comprehensive Validation System**
  - JSON Schema for MDD documents (via `@markdownkit/remark-mdd/schema`)
  - Document type requirements schema (via `@markdownkit/remark-mdd/schema/requirements`)
  - TypeScript type definitions (via `@markdownkit/remark-mdd/types`)
  - Standalone CLI validation tool (`mdd-validate`)
  - Validation library (via `@markdownkit/remark-mdd/validator`)

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

[Unreleased]: https://github.com/entro314-labs/mdd/compare/v4.0.0...HEAD
[4.0.0]: https://github.com/entro314-labs/mdd/releases/tag/v4.0.0

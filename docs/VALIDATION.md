# MDD Validation Guide

Complete guide to MDD document validation, schemas, and error handling.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Validation CLI](#validation-cli)
- [Integration with Preview](#integration-with-preview)
- [Validation Rules](#validation-rules)
- [JSON Schema](#json-schema)
- [TypeScript Types](#typescript-types)
- [Error Codes Reference](#error-codes-reference)
- [CI/CD Integration](#cicd-integration)

## Overview

MDD provides comprehensive document validation to catch errors early, ensure document quality, and enable tooling integration. The validation system includes:

- **Frontmatter schema validation** - Required fields, date formats, document types
- **Directive structure validation** - End markers, nesting rules, duplicate detection
- **Document type requirements** - Type-specific required/recommended elements
- **Semantic class validation** - Whitelist of valid CSS classes
- **Cross-reference validation** - Broken link detection (planned)

## Quick Start

### Validate a document

```bash
# Validate single document
pnpm run validate examples/invoice.mdd

# Validate all documents
pnpm run validate:all

# Strict mode (fail on warnings)
pnpm run validate:strict examples/invoice.mdd
```

### Preview with validation

```bash
# Preview includes validation by default
pnpm run preview examples/invoice.mdd

# Skip validation (faster)
node preview.js --no-validate examples/invoice.mdd

# Strict mode
node preview.js --strict examples/invoice.mdd
```

### Programmatic usage

```javascript
import { validateDocument } from './lib/validator.js';

const content = `---
title: My Document
document-type: business-letter
date: 2024-12-15
---

# My Document

::letterhead
Company Name
::
`;

const result = validateDocument(content, {
  validateFrontmatterFlag: true,
  validateDirectivesFlag: true,
  validateRequirementsFlag: true,
  validateClassesFlag: true,
  strict: false
});

if (!result.valid) {
  console.error('Validation failed:', result.errors);
}
```

## Validation CLI

The `mdd-validate` CLI tool provides standalone validation with detailed error reporting.

### Usage

```bash
mdd-validate [OPTIONS] <file.mdd> [file2.mdd ...]
```

### Options

- `-s, --strict` - Treat warnings as errors (exit code 2)
- `-v, --verbose` - Show detailed validation information
- `-j, --json` - Output results as JSON
- `-h, --help` - Show help message
- `--version` - Show version information

### Examples

```bash
# Validate single document
mdd-validate document.mdd

# Validate multiple documents
mdd-validate invoice.mdd proposal.mdd contract.mdd

# Strict mode (fail on warnings)
mdd-validate --strict document.mdd

# JSON output for CI/CD integration
mdd-validate --json document.mdd > validation-report.json

# Verbose output with directive summary
mdd-validate --verbose document.mdd
```

### Exit Codes

- `0` - All documents valid
- `1` - Validation errors found
- `2` - Warnings found (strict mode only)

### Output Format

#### Human-readable (default)

```
────────────────────────────────────────────────────────────────────────────────
✓ VALID examples/business-letter.mdd
────────────────────────────────────────────────────────────────────────────────
Document Type: business-letter │ Title: My Letter │ Directives: 2 (2 types) │ Errors: 0 │ Warnings: 0 │ Time: 3ms
────────────────────────────────────────────────────────────────────────────────

✓ Document is valid
```

#### With errors

```
────────────────────────────────────────────────────────────────────────────────
✗ INVALID examples/invoice.mdd
────────────────────────────────────────────────────────────────────────────────
Document Type: invoice │ Title: Invoice #001 │ Directives: 3 (3 types) │ Errors: 2 │ Warnings: 1 │ Time: 4ms
────────────────────────────────────────────────────────────────────────────────

ERRORS (2):

✗ ERROR [MISSING_REQUIRED_FIELD]
  Document type "invoice" requires frontmatter field: invoice-number
  at field "invoice-number"
  💡 Add "invoice-number: value" to your frontmatter

✗ ERROR [MISSING_END_MARKER]
  Directive ::letterhead at line 8 is missing end marker ::
  at line 8, directive ::letterhead
  💡 Add :: on its own line after the letterhead content

WARNINGS (1):

⚠ WARNING [EMPTY_DIRECTIVE]
  Directive ::footer at line 42 is empty
  at line 42, directive ::footer
  💡 Add content inside the ::footer block or remove it
```

#### JSON output

```json
[
  {
    "valid": false,
    "errors": [
      {
        "type": "error",
        "code": "MISSING_REQUIRED_FIELD",
        "message": "Document type \"invoice\" requires frontmatter field: invoice-number",
        "location": {
          "field": "invoice-number"
        },
        "suggestion": "Add \"invoice-number: value\" to your frontmatter"
      }
    ],
    "warnings": [],
    "frontmatter": {
      "title": "Invoice #001",
      "document-type": "invoice",
      "date": "2024-12-15"
    },
    "directives": [
      {
        "type": "letterhead",
        "content": "Company Name\n123 Street",
        "line": 8,
        "hasEndMarker": true
      }
    ],
    "directiveCounts": {
      "letterhead": 1,
      "header": 1,
      "footer": 1
    },
    "filePath": "examples/invoice.mdd",
    "processingTime": 4,
    "exitCode": 1
  }
]
```

## Integration with Preview

The `preview.js` script automatically validates documents before rendering.

### Validation Report in HTML

When validation errors or warnings are found, they appear at the top of the generated HTML:

```bash
node preview.js examples/invoice.mdd
```

**Output HTML includes:**
- Color-coded error/warning boxes
- Error codes and messages
- Line numbers and locations
- Helpful suggestions for fixes

### Skip Validation

For faster preview generation during development:

```bash
node preview.js --no-validate examples/invoice.mdd
```

### Strict Mode

Fail preview generation if warnings are found:

```bash
node preview.js --strict examples/invoice.mdd
```

## Validation Rules

### Frontmatter Validation

#### Required Fields

All documents MUST have:
- `title` (non-empty string, max 200 characters)
- `document-type` (valid enum value)

#### Optional Fields with Validation

- `date`, `effective-date`, `expiration-date`, `due-date` - ISO 8601 format (`YYYY-MM-DD`)
- `version` - Semantic versioning (`X.Y` or `X.Y.Z`)
- `status` - One of: `draft`, `final`, `approved`, `pending`, `archived`
- `language` - ISO 639-1 code (`en`, `en-US`, `el-GR`)
- `total-amount` - Currency format (`USD 1,234.56`, `EUR 1.234,56`)

#### Document Type Enum

Valid `document-type` values:

```
business-letter, business-proposal, invoice, proposal, contract, legal-contract,
agreement, memorandum, memo, report, legal-notice, legal-guide,
terms-of-service, privacy-policy, nda, employment-contract, purchase-order,
quote, estimate, receipt, statement, notice, certificate, affidavit,
power-of-attorney, will, trust, deed, lease, rental-agreement,
service-agreement, consulting-agreement, partnership-agreement,
operating-agreement, shareholder-agreement, articles-of-incorporation,
bylaws, resolution, minutes, policy, procedure, manual, guide,
specification, requirements, whitepaper, case-study, brief, motion,
complaint, answer, discovery, subpoena, summons, warrant, order,
judgment, decree, other
```

### Directive Validation

#### End Marker Rules

All block directives MUST have end markers:

```markdown
::letterhead
Content here
::  <!-- Required -->
```

Self-closing directives do not need end markers:

```markdown
::page-break ::
::: section-break :::
```

#### Empty Directive Detection

Empty directives produce warnings:

```markdown
::letterhead
::  <!-- Warning: empty directive -->
```

#### Nesting Rules

Directives cannot be nested (current limitation):

```markdown
::letterhead
  ::header  <!-- Error: invalid nesting -->
  Content
  ::
::
```

### Document Type Requirements

Each document type has specific required and recommended elements.

#### Invoice Requirements

**Required:**
- Frontmatter: `title`, `date`, `document-type`, `invoice-number`
- Directives: `::letterhead`, `::header`

**Recommended:**
- Frontmatter: `author`, `recipient`, `payment-terms`, `due-date`, `total-amount`, `purchase-order`
- Directives: `::footer`, `::contact-info`

#### Contract/Agreement Requirements

**Required:**
- Frontmatter: `title`, `date`, `document-type`, `parties`, `effective-date`
- Directives: `::letterhead`, `::signature-block`

**Recommended:**
- Frontmatter: `jurisdiction`, `expiration-date`, `reference-number`
- Directives: `::header`, `::footer`

#### Business Letter Requirements

**Required:**
- Frontmatter: `title`, `date`, `document-type`
- Directives: `::letterhead`, `::signature-block`

**Recommended:**
- Frontmatter: `author`, `recipient`, `subject`
- Directives: `::contact-info`

See [schema/document-type-requirements.json](../schema/document-type-requirements.json) for complete requirements.

### Semantic Class Validation

Only whitelisted CSS classes are allowed in `{.class-name}` annotations.

**Valid classes:**
```
invoice-title, contract-title, legal-notice, numbered-section,
long-paragraph, legal-clause, numbered-item, document-section,
subsection, section-title, important, warning, note, example,
quote-block, signature-line, witness-line, notary-line, party-name,
effective-date, expiration-date, payment-terms, total-amount,
item-description, item-quantity, item-price, subtotal, tax, total,
footer-note, page-number, confidential-notice, copyright-notice,
recipient-address, sender-address, date-line, subject-line,
salutation, closing, enclosure, cc-line, reference-number
```

Unknown classes produce warnings.

## JSON Schema

MDD provides comprehensive JSON Schema for validation and tooling.

### Schema Files

- [schema/mdd-document.schema.json](../schema/mdd-document.schema.json) - Main document schema
- [schema/document-type-requirements.json](../schema/document-type-requirements.json) - Per-type requirements

### Using the Schema

#### With VS Code

Add to `.vscode/settings.json`:

```json
{
  "yaml.schemas": {
    "./schema/mdd-document.schema.json#/definitions/frontmatter": "*.mdd"
  }
}
```

#### With AJV (Node.js)

```javascript
import Ajv from 'ajv';
import schema from './schema/mdd-document.schema.json' assert { type: 'json' };

const ajv = new Ajv();
const validate = ajv.compile(schema.definitions.frontmatter);

const frontmatter = {
  title: 'My Document',
  'document-type': 'business-letter',
  date: '2024-12-15'
};

if (!validate(frontmatter)) {
  console.error(validate.errors);
}
```

## TypeScript Types

Complete TypeScript type definitions are available for type-safe MDD development.

### Using Types

```typescript
import type {
  MDDFrontmatter,
  MDDDocument,
  ValidationResult,
  DirectiveType,
  SemanticClass,
  DocumentType
} from './types/mdd.d.ts';

const frontmatter: MDDFrontmatter = {
  title: 'My Document',
  'document-type': 'business-letter',
  date: '2024-12-15',
  author: 'John Doe'
};

function processDocument(doc: MDDDocument): ValidationResult {
  // Type-safe validation
  if (!doc.frontmatter.title) {
    throw new Error('Title required');
  }

  return {
    valid: true,
    errors: [],
    warnings: []
  };
}
```

### Available Types

See [types/mdd.d.ts](../types/mdd.d.ts) for complete type definitions:

- `MDDFrontmatter` - Frontmatter metadata structure
- `MDDDocument` - Complete parsed document
- `ValidationResult` - Validation output
- `ValidationError` - Error/warning structure
- `DirectiveType` - Valid directive types
- `DocumentType` - Valid document types
- `SemanticClass` - Valid CSS classes
- And more...

## Error Codes Reference

### Frontmatter Errors

| Code | Description | Severity |
|------|-------------|----------|
| `MISSING_FRONTMATTER` | Document has no YAML frontmatter | Error |
| `MISSING_REQUIRED_FIELD` | Required field missing from frontmatter | Error |
| `INVALID_DATE_FORMAT` | Date not in YYYY-MM-DD format | Error |
| `INVALID_DOCUMENT_TYPE` | Document type not in enum | Error |
| `INVALID_VERSION_FORMAT` | Version not in X.Y or X.Y.Z format | Error |
| `INVALID_STATUS` | Status not in allowed values | Error |
| `INVALID_LANGUAGE_CODE` | Language code not ISO 639-1 | Error |
| `INVALID_CURRENCY_FORMAT` | Currency not in CCC #,###.## format | Error |

### Directive Errors

| Code | Description | Severity |
|------|-------------|----------|
| `MISSING_END_MARKER` | Directive missing `::` end marker | Error |
| `EMPTY_DIRECTIVE` | Directive has no content | Warning |
| `INVALID_DIRECTIVE_NESTING` | Directive nested inside another | Error |
| `DUPLICATE_DIRECTIVE` | Directive appears more than allowed | Warning |
| `MISSING_REQUIRED_DIRECTIVE` | Required directive for document type missing | Error |
| `ORPHANED_END_MARKER` | End marker `::` without matching start | Error |

### Text Formatting Errors

| Code | Description | Severity |
|------|-------------|----------|
| `INVALID_REFERENCE` | Internal reference `@section-1` target missing | Warning |
| `OVERLAPPING_FORMATTING` | Formatting patterns overlap | Warning |
| `MALFORMED_PATTERN` | Text formatting syntax error | Warning |

### Semantic Class Errors

| Code | Description | Severity |
|------|-------------|----------|
| `INVALID_SEMANTIC_CLASS` | Class syntax error | Warning |
| `UNKNOWN_SEMANTIC_CLASS` | Class not in whitelist | Warning |

### Document Structure Errors

| Code | Description | Severity |
|------|-------------|----------|
| `INVALID_DIRECTIVE_ORDER` | Directives in wrong order | Warning |

## CI/CD Integration

### GitHub Actions

```yaml
name: Validate MDD Documents

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '22'

      - run: npm install

      - name: Validate Documents
        run: npm run validate:all

      - name: Generate Validation Report
        if: always()
        run: |
          node mdd-validate.js --json docs/*.mdd > validation-report.json

      - name: Upload Validation Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: validation-report
          path: validation-report.json
```

### GitLab CI

```yaml
validate-mdd:
  image: node:22
  script:
    - npm install
    - npm run validate:all
  artifacts:
    when: always
    reports:
      junit: validation-report.xml
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Validate changed .mdd files
CHANGED_MDD=$(git diff --cached --name-only --diff-filter=ACM | grep '\.mdd$')

if [ -n "$CHANGED_MDD" ]; then
  echo "Validating MDD documents..."
  node mdd-validate.js $CHANGED_MDD

  if [ $? -ne 0 ]; then
    echo "MDD validation failed. Commit aborted."
    exit 1
  fi
fi
```

### NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "precommit": "node mdd-validate.js $(git diff --cached --name-only --diff-filter=ACM | grep '\\.mdd$')",
    "prepush": "npm run validate:all",
    "validate:ci": "node mdd-validate.js --json docs/*.mdd > validation-report.json"
  }
}
```

## Best Practices

### 1. Validate Early and Often

Run validation during development:

```bash
# Watch mode (requires nodemon)
npx nodemon --watch '**/*.mdd' --exec 'npm run validate:all'
```

### 2. Use Strict Mode in CI/CD

Catch all issues including warnings:

```bash
npm run validate:strict
```

### 3. Add Validation to Editor

- Use JSON Schema for YAML frontmatter validation
- Enable TypeScript for type-safe tooling
- Configure ESLint/Prettier for consistent formatting

### 4. Document Custom Requirements

Extend validation for project-specific needs:

```javascript
import { validateDocument } from './lib/validator.js';

function validateProjectRequirements(content, frontmatter) {
  const errors = [];

  // Custom rule: All contracts must have legal review
  if (frontmatter['document-type'] === 'contract') {
    if (!frontmatter['legal-reviewed']) {
      errors.push({
        type: 'error',
        code: 'MISSING_LEGAL_REVIEW',
        message: 'Contracts must have legal-reviewed: true in frontmatter'
      });
    }
  }

  return errors;
}
```

### 5. Generate Validation Reports

Track validation issues over time:

```bash
# Generate daily validation report
node mdd-validate.js --json docs/*.mdd > reports/$(date +%Y-%m-%d).json
```

## Troubleshooting

### Common Issues

#### "Invalid date format"

**Problem:** Date includes time or timezone
```yaml
date: 2024-12-15T10:00:00Z  # ✗ Wrong
```

**Solution:** Use ISO 8601 date only
```yaml
date: 2024-12-15  # ✓ Correct
```

#### "Missing end marker"

**Problem:** Directive not closed
```markdown
::letterhead
Content
<!-- Missing :: here -->
```

**Solution:** Add end marker
```markdown
::letterhead
Content
::  <!-- ✓ Correct -->
```

#### "Unknown semantic class"

**Problem:** Typo or custom class
```markdown
# Title {.invioce-title}  <!-- ✗ Typo -->
```

**Solution:** Fix typo or use valid class
```markdown
# Title {.invoice-title}  <!-- ✓ Correct -->
```

### Debug Mode

Enable verbose validation output:

```bash
DEBUG=mdd:* node mdd-validate.js document.mdd
```

---

For more information:
- [Main README](../README.md)
- [MDD Specification](../SPECIFICATION.md)
- [JSON Schema](../schema/mdd-document.schema.json)
- [TypeScript Types](../types/mdd.d.ts)

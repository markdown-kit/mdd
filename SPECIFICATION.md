# MDD (Markdown Document) Specification

## Core Purpose

**Problem:** AI-generated markdown and business document workflows are disconnected. Converting between markdown ↔ PDF/DOCX loses document structure, semantic meaning, and professional formatting.

**Solution:** MDD extends markdown with minimal semantic directives that preserve document structure throughout the conversion pipeline. The result is a format that bridges AI content generation with professional document output.

**Goal:** Edit documents as readable markdown, convert to professional PDF/DOCX/HTML with high fidelity while preserving semantic structure.

## Philosophy

- **Minimal syntax** - Barely more than standard markdown. If you know markdown, you know 90% of MDD.
- **Semantic preservation** - Directives capture document _intent_ (letterhead, signature), not just _appearance_ (bold, centered). This enables high-fidelity multi-format conversion.
- **Multi-format output** - Single source generates HTML (preview), PDF (final), and DOCX (collaborative editing).
- **AI workflow ready** - Designed for the modern content pipeline where AI generates markdown and businesses need professional documents.
- **Professional output** - Documents indistinguishable from Word/LaTeX originals, with zero configuration required.

## Document Structure Extensions

### 1. Document Sections

A block directive opens with `:::name` on its own line and closes with `:::` on its own line. A self-closing directive is a single `::name` line. This is the [remark-directive](https://github.com/remarkjs/remark-directive) grammar, so any remark-directive pipeline parses MDD as it is, and a document round-trips through such a pipeline byte for byte.

```markdown
:::letterhead
Organization Name
Address Line 1
Address Line 2
:::

:::header
Company Name | Document Title | Page {{page}}
:::

:::footer
Confidential | © 2024 Company Name
:::

:::contact-info
Phone: (555) 123-4567
Email: contact@company.com
Website: www.company.com
:::

:::signature-block
Signature: ____________________
Name: [Print name here]
Date: ____________________
:::

::page-break
```

Directives do not nest. A directive opener must start a new Markdown block: the line above it is blank, a heading, a thematic break, or a fence delimiter. Any other line (prose, a list item, a table row, the `:::` that closes the previous directive) makes Markdown fold the opener into that paragraph, so the validator rejects it (`DIRECTIVE_NOT_BLOCK_START`).

`{{page}}` inside `:::header`/`:::footer` is the current page number: a live field in PDF and DOCX, and `1` (as `<span class="page-number">`) in the single-page HTML preview.

#### MDD 2 spelling

MDD 2 wrote a block as `::name` … `::`, a page break as `::page-break ::` (or `::page-break` closed by `::`), and a section break as `::: section-break :::` (or closed by `:::`). Tools read that spelling for one more major version and report it as `LEGACY_DIRECTIVE_SYNTAX`; `mdd-migrate` rewrites a file. A `:::name` block is only closed by `:::`, and a `::name` block only by `::`.

### 2. Semantic Classes

```markdown
# Executive Summary {.document-section}
## Financial Results {.numbered-section}
### Revenue Analysis {.subsection}

Important legal text. {.legal-notice}
Highlighted information. {.emphasis}
```

### 3. Section Breaks

```markdown
Content on page 1.

::section-break

Content on page 2.
```

### 4. Document Metadata (Minimal)

```yaml
---
title: "Συγκατοίκηση στην Ελλάδα 2024-2025"
author: "Legal Department"
date: "2024-12-15"
document-type: "legal-guide"
---
```

## Example: Business Letter

```markdown
---
title: "Service Proposal"
date: "2024-12-15"
document-type: "business-letter"
---

:::letterhead
ACME Consulting Services
123 Business Street
San Francisco, CA 94102
:::

:::header
ACME Consulting | Proposal
:::

:::footer
Page {{page}} | Confidential
:::

December 15, 2024

Jane Smith
Director of Operations
TechCorp Inc.
456 Innovation Drive
Austin, TX 78701

Dear Ms. Smith,

Thank you for considering ACME Consulting for your digital transformation project.

## Proposed Services

We propose the following services for your organization:

| Service              | Duration | Rate      | Total     |
| -------------------- | -------- | --------- | --------- |
| Strategy Consulting  | 40 hours | $200/hour | $8,000    |
| Implementation       | 80 hours | $150/hour | $12,000   |
| Training & Support   | 20 hours | $100/hour | $2,000    |
| **TOTAL**            |          |           | **$22,000** |

## Timeline

- **Phase 1:** Strategy (Weeks 1-2)
- **Phase 2:** Implementation (Weeks 3-6)
- **Phase 3:** Training (Week 7)

## Next Steps

Please review this proposal and let us know if you have any questions.

:::contact-info
John Doe, Senior Consultant
Phone: (555) 123-4567
Email: john.doe@acmeconsulting.com
:::

Sincerely,

:::signature-block
____________________
John Doe
Senior Consultant
ACME Consulting Services
:::
```

## Example: Invoice

```markdown
---
title: "Invoice"
date: "2024-12-15"
document-type: "invoice"
invoice-number: "INV-2024-001"
---

:::header
ACME Services | Invoice #INV-2024-001
:::

:::letterhead
ACME Services Inc.
123 Business Street
San Francisco, CA 94102
Tax ID: 12-3456789
:::

# INVOICE {.invoice-title}

**Invoice Number:** INV-2024-001
**Date:** December 15, 2024
**Due Date:** January 15, 2025

**Bill To:**
TechCorp Inc.
456 Innovation Drive
Austin, TX 78701

## Services Rendered

| Description          | Quantity | Unit Price | Amount    |
| -------------------- | -------- | ---------- | --------- |
| Consulting Services  | 40       | $200.00    | $8,000.00 |
| Implementation       | 20       | $150.00    | $3,000.00 |
| Training             | 8        | $100.00    | $800.00   |
|                      |          | **SUBTOTAL** | **$11,800.00** |
|                      |          | Tax (10%)  | $1,180.00 |
|                      |          | **TOTAL DUE** | **$12,980.00** |

## Payment Terms

Payment is due within 30 days. Please remit payment to:

:::contact-info
Bank: First National Bank
Account: 123-456-7890
Routing: 987654321
:::

**Thank you for your business!**

:::footer
Questions? Contact us at billing@acmeservices.com | Page {{page}}
:::
```

## Processing Goals

### Input Processing

- Parse `:::directive` blocks into semantic document structure
- Handle `{.semantic-class}` annotations for styling hints
- Preserve all standard markdown features (headings, lists, tables, links)
- Minimal frontmatter for document metadata (title, date, author, document-type)

### Output Targets

- **HTML** - Self-contained preview with print-optimized CSS (`mdd-preview`, `mdd-convert --format html`)
- **PDF** - The same print-optimized HTML rendered by headless Chrome (`mdd-convert --format pdf`)
- **DOCX** - Native Word documents via `@markdownkit/md-docx` (`mdd-convert --format docx`); `:::header`/`:::footer` map to page headers/footers, `{{page}}` in them renders a page-number field, and md-docx's default page numbering applies otherwise

### Conversion Quality

- **Semantic preservation**: Directives maintain meaning across formats (letterhead remains letterhead in HTML, PDF, and DOCX)
- **Professional typography**: Proper heading hierarchy, business document fonts, correct spacing
- **Business conventions**: Signature lines, page headers/footers, letterheads, contact blocks
- **Page handling**: Page breaks, section breaks, multi-page document flow
- **Cross-references**: Internal document links, section numbering, table/figure references

## Implementation Approach

### Two-Stage Conversion Architecture

MDD uses a sophisticated two-stage process that preserves semantic meaning:

**Stage 1: Markdown → semantic AST**

- Remark plugins parse `.mdd` files and turn each directive into a semantic container node (rendered as `<div class="letterhead" data-mdd-directive="letterhead">…</div>`) while keeping the Markdown inside it intact
- This preserves _semantic intent_, not just appearance

**Stage 2: semantic AST → Output Format**

- HTML/PDF: the containers are styled by the print-oriented stylesheet
- DOCX: directives are mapped to Word constructs (page header/footer, page break, styled blocks)
- Semantic structure remains intact throughout the pipeline

### Remark Plugin Chain

1. **remark-frontmatter** - Parse YAML metadata (title, date, author)
2. **remark-gfm** - GitHub Flavored Markdown (tables, strikethrough)
3. **remark-mdd-document-structure** - Parse `::directive` blocks → semantic containers
4. **remark-mdd-text-formatting** - Handle typography (superscripts, subscripts, cross-references)
5. **remark-html** - Convert to HTML

### Design Constraints

**Keep it simple:**

- No template variables beyond the `{{page}}` page-number token in `::header`/`::footer` (use external tools for dynamic content)
- No business logic workflows (MDD is a format, not a CMS)
- No web-specific features (focus on print/document output)
- No complex configuration (zero-config styling by design)

**Focus on:**

- Semantic document structure preservation
- Professional multi-format output (HTML/PDF/DOCX)
- Clean, human-readable source files
- High conversion fidelity across formats

This specification prioritizes **semantic preservation** and **professional output** over feature complexity. MDD is infrastructure - a document abstraction layer for the AI age.

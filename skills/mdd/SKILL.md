---
name: mdd
description: Write, validate and convert MDD (.mdd) documents - business letters, invoices, quotes, proposals, contracts, agreements, NDAs, memos and reports - any document someone would otherwise open Word for. Use this whenever the user asks for such a document, mentions .mdd, a letterhead, a signature block, page headers or footers, or wants markdown turned into a DOCX or PDF, even if they never name the format.
---

# MDD

MDD is GitHub-flavored markdown plus five named blocks that say what the parts of a business document are: letterhead, header, footer, contact info, signature block. Everything else is ordinary markdown. `@markdownkit/mdd` validates a file and converts it to HTML, PDF or DOCX with no styling or templates; the letterhead stays a letterhead in every format.

Pick the extension by what the file is: `.md` for READMEs, notes and technical docs, `.mdx` for docs with components, `.mdd` for documents with a letterhead, signatures or page headers.

## Workflow

1. Write `<name>.mdd` using the reference below.
2. Validate. Every error and warning names the line and the fix, so read the output and edit until it is clean:

   ```bash
   npx mdd-validate --strict <name>.mdd
   ```

3. Convert, or preview as a single HTML file. PDF needs a Chrome that Puppeteer can find; DOCX and HTML need nothing else:

   ```bash
   npx mdd-convert <name>.mdd --format docx   # or pdf, html
   npx mdd-preview <name>.mdd                 # writes <name>.html
   ```

Validate before converting: `mdd-convert` writes nothing when validation fails. The commands above use the `@markdownkit/mdd` already installed in the project; without one, prefix each with `npx -p @markdownkit/mdd`.

## Skeleton

A business letter that passes `--strict`. Copy it and change the content:

```markdown
---
title: "Proposal for Website Redesign"
author: "ACME Consulting"
recipient: "Jane Smith, TechCorp Inc."
subject: "Website redesign proposal"
date: "2026-11-05"
document-type: "business-letter"
---

:::letterhead
ACME Consulting
12 Market Street, Athens 105 57
:::

:::footer
ACME Consulting | Confidential | Page {{page}}
:::

November 5, 2026

Jane Smith
Director of Operations
TechCorp Inc.

Dear Ms. Smith,

Thank you for considering ACME Consulting for the redesign of your website.

## Scope

| Phase     | Duration | Fee        |
| --------- | -------- | ---------- |
| Discovery | 2 weeks  | EUR 4,000  |
| Design    | 4 weeks  | EUR 9,000  |
| **Total** |          | **EUR 13,000** |

## Next steps

Please review and let us know if you have questions.

:::contact-info
John Doe, Senior Consultant
Phone: +30 210 123 4567
Email: john.doe@acme.example
:::

Sincerely,

:::signature-block
____________________
John Doe
Senior Consultant, ACME Consulting
:::
```

## Frontmatter

YAML between `---` lines at the top of the file. `title` and `document-type` are always required. Dates are `YYYY-MM-DD`.

Each document type requires and recommends certain fields and blocks. Missing required ones are errors; missing recommended ones are warnings, which `--strict` also rejects.

| document-type                             | Required fields                                            | Required blocks                 | Recommended                                                                                                    |
| ----------------------------------------- | ---------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `business-letter`                         | `title`, `date`                                            | `letterhead`, `signature-block` | `author`, `recipient`, `subject`; `contact-info`                                                               |
| `invoice`                                 | `title`, `date`, `invoice-number`                          | `letterhead`, `header`          | `author`, `recipient`, `payment-terms`, `due-date`, `total-amount`, `purchase-order`; `footer`, `contact-info` |
| `proposal`, `business-proposal`           | `title`, `date`                                            | `letterhead`                    | `author`, `recipient`, `version`, `status`, `reference-number`; `header`, `footer`, `signature-block`          |
| `contract`, `legal-contract`, `agreement` | `title`, `date`, `parties` (a YAML list), `effective-date` | `letterhead`, `signature-block` | `jurisdiction`, `expiration-date`, `reference-number`, `version` (not for `agreement`); `header`, `footer`     |
| `memo`, `memorandum`                      | `title`, `date`                                            | none                            | `author`, `recipient`, `subject` (+ `reference-number` for memorandum); `header` (+ `footer` for memorandum)   |
| `report`                                  | `title`, `date`                                            | none                            | `letterhead`, `header`, `footer`                                                                               |

Other accepted types (no block requirements): `nda`, `quote`, `estimate`, `receipt`, `purchase-order`, `statement`, `notice`, `legal-notice`, `legal-guide`, `terms-of-service`, `privacy-policy`, `employment-contract`, `service-agreement`, `consulting-agreement`, `partnership-agreement`, `operating-agreement`, `shareholder-agreement`, `rental-agreement`, `lease`, `deed`, `will`, `trust`, `affidavit`, `power-of-attorney`, `certificate`, `articles-of-incorporation`, `bylaws`, `resolution`, `minutes`, `policy`, `procedure`, `manual`, `guide`, `specification`, `requirements`, `whitepaper`, `case-study`, `brief`, `motion`, `complaint`, `answer`, `discovery`, `subpoena`, `summons`, `warrant`, `order`, `judgment`, `decree`, `other`.

Validated optional fields:

- `version`: `1.0` or `1.0.2`
- `status`: `draft`, `review`, `pending`, `approved`, `final`, `sent`, `accepted`, `declined`, `archived`
- `language`: `en`, `en-US`, `el-GR`
- `total-amount`: ISO currency code then the amount with two decimals, `EUR 13,000.00`
- `effective-date`, `expiration-date`, `due-date`: `YYYY-MM-DD`
- Free text: `author`, `recipient`, `subject`, `reference-number`, `jurisdiction`, `invoice-number`, `purchase-order`, `payment-terms`; lists: `parties`, `cc`, `keywords`, `tags`; boolean: `confidential`

## Blocks

Five block directives. Each opens with `:::name` on its own line and closes with `:::` on its own line. The content inside is ordinary markdown.

| Block                | Meaning                                    | Output                                 |
| -------------------- | ------------------------------------------ | -------------------------------------- |
| `:::letterhead`      | Sender identity at the top of the document | Styled block; at most one per document |
| `:::header`          | Text repeated at the top of every page     | Real page header in DOCX and PDF       |
| `:::footer`          | Text repeated at the bottom of every page  | Real page footer in DOCX and PDF       |
| `:::contact-info`    | Phone, email, address, bank details        | Styled block                           |
| `:::signature-block` | Signature lines, names, titles, dates      | Styled block                           |

Two self-closing directives, each a single line: `::page-break` forces a new page, `::section-break` starts a new section.

Rules the validator enforces:

- A directive opener starts a new markdown block: leave a blank line before it. Directly under a paragraph, list item or table row it is swallowed into that paragraph (`DIRECTIVE_NOT_BLOCK_START`).
- Directives do not nest.
- `{{page}}` is the page number and works only inside `:::header` and `:::footer`.
- `:::signature-block` comes after `:::letterhead`.
- Do not leave a block empty.
- Write `:::name` … `:::` only. The older `::name` … `::` spelling still parses but warns (`LEGACY_DIRECTIVE_SYNTAX`).

Place `:::header` and `:::footer` anywhere; they are page furniture, not body content. Put `:::letterhead` first.

## Inline syntax

- `^text^` superscript, `~text~` subscript: `15^th^`, `H~2~O`. Code spans and URLs are left alone.
- `@section-1-2`, `@table-1`, `@figure-1` become links. Headings H1 to H3 are numbered automatically in document order (1, 1.1, 1.1.1) unless the heading text already starts with a number and a dot, so `@section-1-2` is the second H2 under the first H1. Tables and images are numbered in document order. A reference with no target is a warning.
- Do not hand-number headings; the output numbers them.
- `{.class}` at the end of a heading or paragraph marks its role: `# INVOICE {.invoice-title}`, `Governing law is Greek law. {.legal-notice}`. Accepted classes: `invoice-title`, `contract-title`, `legal-notice`, `legal-clause`, `numbered-section`, `numbered-item`, `document-section`, `subsection`, `section-title`, `long-paragraph`, `important`, `emphasis`, `warning`, `note`, `example`, `quote-block`, `signature-line`, `witness-line`, `notary-line`, `party-name`, `effective-date`, `expiration-date`, `payment-terms`, `total-amount`, `item-description`, `item-quantity`, `item-price`, `subtotal`, `tax`, `total`, `footer-note`, `page-number`, `confidential-notice`, `copyright-notice`, `recipient-address`, `sender-address`, `date-line`, `subject-line`, `salutation`, `closing`, `enclosure`, `cc-line`, `reference-number`. Anything else warns.

Tables, lists, bold, links, blockquotes and code work as in GitHub-flavored markdown. There are no template variables other than `{{page}}`; put real values in the file.

## Reading validator output

Each finding has a code, a line and a suggestion. The ones that come up most:

- `MISSING_REQUIRED_FIELD`, `MISSING_REQUIRED_DIRECTIVE`: the document type's table row above.
- `INVALID_DATE_FORMAT`, `INVALID_CURRENCY_FORMAT`, `INVALID_STATUS`, `INVALID_DOCUMENT_TYPE`: the field formats above.
- `MISSING_END_MARKER`: add `:::` after the block.
- `EMPTY_DIRECTIVE`: fill the block or delete it.
- `INVALID_REFERENCE`: the `@section-…` target does not exist; count headings or drop the reference.

Full specification: `SPECIFICATION.md` in the `@markdownkit/mdd` package or at <https://github.com/entro314-labs/mdd>.

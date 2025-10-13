# Contributing to MDD

Thank you for your interest in contributing to MDD (Markdown Document)! This guide will help you get started.

## Project Purpose

MDD is a business-focused markdown extension for creating professional documents (invoices, proposals, letters, contracts) that convert to high-fidelity PDF and DOCX outputs. The philosophy is **minimal syntax, maximum professionalism**.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/entro314-labs/mdd.git
cd mdd

# Install dependencies
pnpm install

# Run tests
pnpm test

# Preview an example
pnpm run preview examples/business-letter.mdd
```

## Project Structure

```
mdd/
├── plugins/           # Remark plugins (core logic)
├── examples/          # .mdd example documents
├── docs/              # Documentation
├── preview.js         # HTML preview generator
├── test.js            # Test suite
└── package.json       # Dependencies and scripts
```

## How to Contribute

### Adding New Directives

When adding a new `::directive`:

1. **Add pattern** to `STRUCTURE_PATTERNS` in `plugins/remark-mdd-document-structure.js`
2. **Implement function** following existing patterns (see `createLetterhead()`, `createSignatureBlock()`)
3. **Add switch case** to `createDocumentElement()`
4. **Add LaTeX → HTML** conversion in `preview.js`
5. **Add CSS styling** in `preview.js` template
6. **Update SPECIFICATION.md** with syntax example
7. **Add example** to an `.mdd` file in `examples/`
8. **Run tests** to ensure nothing broke

### Adding New Text Formatting

When adding new inline formatting (like `^super^` or `~sub~`):

1. **Add regex pattern** to `TEXT_PATTERNS` in `plugins/remark-mdd-text-formatting.js`
2. **Add detection logic** in `processTextFormatting()` function
3. **Add rendering logic** in `createFormattedNode()` switch
4. **Update SPECIFICATION.md** with syntax example
5. **Add example** to `examples/comprehensive-document.mdd`
6. **Run tests** to verify

### Improving Documentation

- **SPECIFICATION.md**: Complete MDD syntax reference
- **README.md**: User-facing quick start guide
- **docs/MDD-PREVIEW.md**: Preview renderer technical details
- **docs/BUSINESS-DOCUMENTS.md**: Document type catalog

All documentation should be clear, concise, and example-driven.

### Adding Examples

Create new `.mdd` files in `examples/` demonstrating:
- Real business document use cases
- Proper directive usage
- Text formatting features
- Semantic classes

## Code Style

- **ES6 modules**: Use `import`/`export`
- **2-space indentation**: Configured for JavaScript/JSON
- **JSDoc comments**: For complex functions
- **Descriptive names**: No abbreviations
- **Never use `any`**: If TypeScript is added

## Testing

```bash
# Run all tests
pnpm test

# Preview specific example
pnpm run preview examples/your-file.mdd

# Check generated HTML in browser
open examples/your-file.html
```

Manual testing checklist:
- [ ] Preview generates HTML without errors
- [ ] Directives render correctly in browser
- [ ] Print preview (Cmd/Ctrl+P) looks professional
- [ ] No console errors in browser
- [ ] All existing examples still work

## Design Principles

### DO ✅
- Keep syntax minimal and intuitive
- Focus on print/PDF output quality
- Prioritize business document use cases
- Maintain human-readable source files
- Follow existing patterns and conventions
- Add comprehensive documentation

### DON'T ❌
- Add template variables or business logic
- Create web-specific HTML features
- Break backward compatibility
- Add dependencies unnecessarily
- Make directives complex or nested
- Implement features for developer docs (that's markdownfix)

## Submitting Changes

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following the guidelines above
4. **Add tests** if applicable
5. **Update documentation** (SPECIFICATION.md, README.md, etc.)
6. **Run tests**: `pnpm test`
7. **Commit your changes**: Use descriptive commit messages
8. **Push to your fork**: `git push origin feature/your-feature-name`
9. **Open a Pull Request** with a clear description

### Commit Message Format

```
feat: Add invoice total calculation directive

- Implement ::calculate-total directive
- Add CSS styling for totals row
- Update SPECIFICATION.md
- Add example to invoice.mdd
```

Use prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, no logic change)
- `refactor:` - Code restructuring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Questions or Issues?

- **Bug reports**: Open an issue with reproduction steps
- **Feature requests**: Open an issue describing the use case
- **Questions**: Start a discussion in GitHub Discussions
- **Security issues**: Email dominik@example.com directly

## License

By contributing to MDD, you agree that your contributions will be licensed under the MIT License.

## Related Projects

- **[markdownfix](../markdownfix/)**: Markdown formatter for developer documentation
- Use markdownfix for `.md`/`.mdx` files, MDD for `.mdd` business documents

## Thank You!

Your contributions help make MDD better for everyone creating professional business documents.

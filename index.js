/**
 * MDD (Markdown Document)
 * Business-focused markdown extension for professional documents
 *
 * This package provides CLI tools for MDD.
 * For programmatic usage of plugins, use @markdownkit/remark-mdd
 */

// Re-export plugins from remark-mdd for backwards compatibility
export {
  remarkMddDocumentStructure,
  remarkMddTextFormatting,
  remarkMdxConditional
} from '@markdownkit/remark-mdd';

// Re-export validator for backwards compatibility
export { validateDocument } from '@markdownkit/remark-mdd/validator';

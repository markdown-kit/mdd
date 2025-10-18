/**
 * MDD (Markdown Document)
 * Business-focused markdown extension for professional documents
 *
 * This package provides CLI tools for MDD.
 * For programmatic usage of plugins, use @entro314labs/remark-mdd
 */

// Re-export plugins from remark-mdd for backwards compatibility
export {
  remarkMddDocumentStructure,
  remarkMddTextFormatting,
  remarkMdxConditional
} from '@entro314labs/remark-mdd';

// Re-export validator for backwards compatibility
export { validateDocument } from '@entro314labs/remark-mdd/validator';

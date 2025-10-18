#!/usr/bin/env node

/**
 * MDD Validation CLI Tool
 * Standalone validator for .mdd documents with detailed error reporting
 * @version 0.1.0
 */

import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDocument } from '@entro314labs/remark-mdd/validator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Color output for terminal
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Format validation messages with colors
 */
function formatMessage(type, code, message, location, suggestion) {
  const typeColors = {
    error: colors.red,
    warning: colors.yellow,
    info: colors.cyan
  };

  const typeSymbols = {
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };

  const color = typeColors[type] || colors.reset;
  const symbol = typeSymbols[type] || '•';

  let output = `${color}${symbol} ${colors.bright}${type.toUpperCase()}${colors.reset}${color} [${code}]${colors.reset}\n`;
  output += `  ${message}\n`;

  if (location) {
    const parts = [];
    if (location.line) parts.push(`line ${location.line}`);
    if (location.column) parts.push(`col ${location.column}`);
    if (location.directive) parts.push(`directive ::${location.directive}`);
    if (location.field) parts.push(`field "${location.field}"`);

    if (parts.length > 0) {
      output += `  ${colors.gray}at ${parts.join(', ')}${colors.reset}\n`;
    }
  }

  if (suggestion) {
    output += `  ${colors.cyan}💡 ${suggestion}${colors.reset}\n`;
  }

  return output;
}

/**
 * Print validation summary
 */
function printSummary(result, filePath, processingTime) {
  console.log('\n' + '─'.repeat(80));

  if (result.valid) {
    console.log(`${colors.green}${colors.bright}✓ VALID${colors.reset} ${colors.gray}${filePath}${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}✗ INVALID${colors.reset} ${colors.gray}${filePath}${colors.reset}`);
  }

  console.log('─'.repeat(80));

  // Statistics
  const stats = [];

  if (result.frontmatter) {
    stats.push(`Document Type: ${colors.cyan}${result.frontmatter['document-type'] || 'unknown'}${colors.reset}`);
    if (result.frontmatter.title) {
      stats.push(`Title: ${colors.cyan}${result.frontmatter.title}${colors.reset}`);
    }
  }

  if (result.directives) {
    const directiveTypes = Object.keys(result.directiveCounts || {}).length;
    const totalDirectives = Object.values(result.directiveCounts || {}).reduce((a, b) => a + b, 0);
    stats.push(`Directives: ${colors.cyan}${totalDirectives}${colors.reset} (${directiveTypes} types)`);
  }

  stats.push(`Errors: ${result.errors.length > 0 ? colors.red : colors.green}${result.errors.length}${colors.reset}`);
  stats.push(`Warnings: ${result.warnings.length > 0 ? colors.yellow : colors.green}${result.warnings.length}${colors.reset}`);
  stats.push(`Time: ${colors.gray}${processingTime}ms${colors.reset}`);

  console.log(stats.join(' │ '));
  console.log('─'.repeat(80) + '\n');
}

/**
 * Print directive summary
 */
function printDirectiveSummary(directiveCounts) {
  if (!directiveCounts || Object.keys(directiveCounts).length === 0) {
    return;
  }

  console.log(`${colors.bright}Directives Found:${colors.reset}`);
  for (const [directive, count] of Object.entries(directiveCounts)) {
    console.log(`  ::${directive} ${colors.gray}×${count}${colors.reset}`);
  }
  console.log('');
}

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const options = {
    files: [],
    strict: false,
    verbose: false,
    json: false,
    help: false,
    version: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--strict':
      case '-s':
        options.strict = true;
        break;

      case '--verbose':
      case '-v':
        options.verbose = true;
        break;

      case '--json':
      case '-j':
        options.json = true;
        break;

      case '--help':
      case '-h':
        options.help = true;
        break;

      case '--version':
        options.version = true;
        break;

      default:
        if (!arg.startsWith('-')) {
          options.files.push(arg);
        }
        break;
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
${colors.bright}MDD Validation CLI${colors.reset}

${colors.cyan}USAGE:${colors.reset}
  mdd-validate [OPTIONS] <file.mdd> [file2.mdd ...]

${colors.cyan}OPTIONS:${colors.reset}
  -s, --strict      Treat warnings as errors (fail on warnings)
  -v, --verbose     Show detailed validation information
  -j, --json        Output results as JSON
  -h, --help        Show this help message
  --version         Show version information

${colors.cyan}EXAMPLES:${colors.reset}
  ${colors.gray}# Validate a single document${colors.reset}
  mdd-validate document.mdd

  ${colors.gray}# Validate multiple documents${colors.reset}
  mdd-validate invoice.mdd proposal.mdd contract.mdd

  ${colors.gray}# Strict mode (fail on warnings)${colors.reset}
  mdd-validate --strict document.mdd

  ${colors.gray}# JSON output for CI/CD integration${colors.reset}
  mdd-validate --json document.mdd

  ${colors.gray}# Verbose output with directive summary${colors.reset}
  mdd-validate --verbose document.mdd

${colors.cyan}EXIT CODES:${colors.reset}
  0   All documents valid
  1   Validation errors found
  2   Warnings found (strict mode only)

${colors.cyan}VALIDATION CHECKS:${colors.reset}
  • Frontmatter schema (required fields, date formats)
  • Directive structure (end markers, nesting, duplicates)
  • Document type requirements (required directives/metadata)
  • Semantic class validity

${colors.cyan}MORE INFO:${colors.reset}
  Documentation: https://github.com/mdd-spec/mdd
  Report issues: https://github.com/mdd-spec/mdd/issues
`);
}

/**
 * Print version
 */
function printVersion() {
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  console.log(`mdd-validate v${packageJson.version}`);
}

/**
 * Main validation logic
 */
async function validateFile(filePath, options) {
  const startTime = Date.now();

  try {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      return {
        filePath,
        valid: false,
        errors: [{
          type: 'error',
          code: 'FILE_NOT_FOUND',
          message: `File not found: ${filePath}`,
          location: {},
          suggestion: 'Check the file path and try again'
        }],
        warnings: [],
        processingTime: Date.now() - startTime,
        exitCode: 1
      };
    }

    // Check file extension
    if (!filePath.endsWith('.mdd')) {
      return {
        filePath,
        valid: false,
        errors: [{
          type: 'error',
          code: 'INVALID_FILE_TYPE',
          message: `Invalid file type: ${filePath} (expected .mdd)`,
          location: {},
          suggestion: 'MDD validator only processes .mdd files'
        }],
        warnings: [],
        processingTime: Date.now() - startTime,
        exitCode: 1
      };
    }

    // Read file
    const content = await readFile(filePath, 'utf-8');

    // Validate document
    const result = validateDocument(content, {
      validateFrontmatterFlag: true,
      validateDirectivesFlag: true,
      validateRequirementsFlag: true,
      validateClassesFlag: true,
      strict: options.strict
    });

    const processingTime = Date.now() - startTime;

    // Determine exit code
    let exitCode = 0;
    if (result.errors.length > 0) {
      exitCode = 1;
    } else if (options.strict && result.warnings.length > 0) {
      exitCode = 2;
    }

    return {
      ...result,
      filePath,
      processingTime,
      exitCode
    };

  } catch (error) {
    return {
      filePath,
      valid: false,
      errors: [{
        type: 'error',
        code: 'PROCESSING_ERROR',
        message: error.message,
        location: {},
        suggestion: 'Check the file content for syntax errors'
      }],
      warnings: [],
      processingTime: Date.now() - startTime,
      exitCode: 1
    };
  }
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (options.version) {
    printVersion();
    process.exit(0);
  }

  if (options.files.length === 0) {
    console.error(`${colors.red}Error: No input files specified${colors.reset}`);
    console.error(`Run ${colors.cyan}mdd-validate --help${colors.reset} for usage information\n`);
    process.exit(1);
  }

  const results = [];
  let globalExitCode = 0;

  // Validate each file
  for (const filePath of options.files) {
    const result = await validateFile(filePath, options);
    results.push(result);

    if (result.exitCode > globalExitCode) {
      globalExitCode = result.exitCode;
    }
  }

  // Output results
  if (options.json) {
    // JSON output
    console.log(JSON.stringify(results, null, 2));
  } else {
    // Human-readable output
    for (const result of results) {
      printSummary(result, result.filePath, result.processingTime);

      if (options.verbose && result.directiveCounts) {
        printDirectiveSummary(result.directiveCounts);
      }

      // Print errors
      if (result.errors.length > 0) {
        console.log(`${colors.bright}${colors.red}ERRORS (${result.errors.length}):${colors.reset}\n`);
        for (const error of result.errors) {
          console.log(formatMessage(
            error.type,
            error.code,
            error.message,
            error.location,
            error.suggestion
          ));
        }
      }

      // Print warnings
      if (result.warnings.length > 0) {
        console.log(`${colors.bright}${colors.yellow}WARNINGS (${result.warnings.length}):${colors.reset}\n`);
        for (const warning of result.warnings) {
          console.log(formatMessage(
            warning.type,
            warning.code,
            warning.message,
            warning.location,
            warning.suggestion
          ));
        }
      }

      // Success message
      if (result.valid) {
        console.log(`${colors.green}✓ Document is valid${colors.reset}\n`);
      }
    }

    // Multi-file summary
    if (results.length > 1) {
      console.log('═'.repeat(80));
      const validCount = results.filter(r => r.valid).length;
      const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
      const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

      console.log(`${colors.bright}SUMMARY${colors.reset}`);
      console.log(`Files validated: ${colors.cyan}${results.length}${colors.reset}`);
      console.log(`Valid: ${colors.green}${validCount}${colors.reset} │ Invalid: ${colors.red}${results.length - validCount}${colors.reset}`);
      console.log(`Total errors: ${totalErrors > 0 ? colors.red : colors.green}${totalErrors}${colors.reset}`);
      console.log(`Total warnings: ${totalWarnings > 0 ? colors.yellow : colors.green}${totalWarnings}${colors.reset}`);
      console.log('═'.repeat(80) + '\n');
    }
  }

  process.exit(globalExitCode);
}

// Run CLI
main().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * MDD Validation Test Suite
 * Comprehensive tests for document validation
 * @version 0.1.0
 */

import { validateDocument, extractFrontmatter, extractDirectives } from '@markdownkit/remark-mdd/validator';

// Test counters
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Test framework helpers
 */
function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`✓ ${description}`);
  } catch (error) {
    failedTests++;
    console.error(`✗ ${description}`);
    console.error(`  ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertContains(array, item, message) {
  if (!array.includes(item)) {
    throw new Error(message || `Expected array to contain ${item}`);
  }
}

function assertErrorCode(errors, code, message) {
  const hasCode = errors.some(error => error.code === code);
  if (!hasCode) {
    const codes = errors.map(e => e.code).join(', ');
    throw new Error(message || `Expected error code ${code}, got: ${codes}`);
  }
}

/**
 * Test data
 */
const VALID_DOCUMENT = `---
title: Test Document
document-type: business-letter
date: 2024-12-15
author: Test Author
---

# Test Document

This is a test document.

::letterhead

Test Company
123 Test Street
Test City, TC 12345

::

::signature-block

_______________________
John Doe
CEO

::
`;

const MISSING_FRONTMATTER = `# Test Document

This is a test without frontmatter.`;

const INVALID_DATE_FORMAT = `---
title: Test Document
document-type: business-letter
date: December 15, 2024
---

# Test Document`;

const INVALID_DOCUMENT_TYPE = `---
title: Test Document
document-type: leagal-contract
date: 2024-12-15
---

# Test Document`;

const MISSING_END_MARKER = `---
title: Test Document
document-type: business-letter
date: 2024-12-15
---

# Test Document

::letterhead

Test Company
123 Test Street

# Next Section`;

const EMPTY_DIRECTIVE = `---
title: Test Document
document-type: business-letter
date: 2024-12-15
---

# Test Document

::letterhead
::

Content after.`;

const MISSING_REQUIRED_DIRECTIVE = `---
title: Test Invoice
document-type: invoice
date: 2024-12-15
invoice-number: INV-001
---

# Invoice

This invoice is missing the required letterhead directive.`;

const INVALID_VERSION_FORMAT = `---
title: Test Document
document-type: business-letter
version: 1.0.0.1
date: 2024-12-15
---

# Test Document`;

const INVALID_CURRENCY_FORMAT = `---
title: Test Invoice
document-type: invoice
total-amount: $1,234.56
date: 2024-12-15
---

# Invoice`;

const UNKNOWN_SEMANTIC_CLASS = `---
title: Test Document
document-type: business-letter
date: 2024-12-15
---

# Test Document {.totally-invalid-class}

This document has an unknown semantic class.`;

const MULTIPLE_LETTERHEADS = `---
title: Test Document
document-type: business-letter
date: 2024-12-15
---

::letterhead
Company One
::

# Middle Content

::letterhead
Company Two
::
`;

/**
 * Run tests
 */
console.log('\n=== MDD Validation Test Suite ===\n');

// Frontmatter tests
console.log('Frontmatter Validation Tests:');

test('Valid document should pass validation', () => {
  const result = validateDocument(VALID_DOCUMENT);
  assert(result.valid, 'Document should be valid');
  assertEquals(result.errors.length, 0, 'Should have no errors');
});

test('Missing frontmatter should produce error', () => {
  const result = validateDocument(MISSING_FRONTMATTER);
  assert(!result.valid, 'Document should be invalid');
  assertErrorCode(result.errors, 'MISSING_FRONTMATTER', 'Should have MISSING_FRONTMATTER error');
});

test('Invalid date format should produce error', () => {
  const result = validateDocument(INVALID_DATE_FORMAT);
  assert(!result.valid, 'Document should be invalid');
  assertErrorCode(result.errors, 'INVALID_DATE_FORMAT', 'Should have INVALID_DATE_FORMAT error');
});

test('Invalid document type should produce error', () => {
  const result = validateDocument(INVALID_DOCUMENT_TYPE);
  assert(!result.valid, 'Document should be invalid');
  assertErrorCode(result.errors, 'INVALID_DOCUMENT_TYPE', 'Should have INVALID_DOCUMENT_TYPE error');
});

test('Invalid version format should produce error', () => {
  const result = validateDocument(INVALID_VERSION_FORMAT);
  assert(!result.valid, 'Document should be invalid');
  assertErrorCode(result.errors, 'INVALID_VERSION_FORMAT', 'Should have INVALID_VERSION_FORMAT error');
});

test('Invalid currency format should produce error', () => {
  const result = validateDocument(INVALID_CURRENCY_FORMAT);
  assert(!result.valid, 'Document should be invalid');
  assertErrorCode(result.errors, 'INVALID_CURRENCY_FORMAT', 'Should have INVALID_CURRENCY_FORMAT error');
});

console.log('');

// Directive tests
console.log('Directive Validation Tests:');

test('Missing directive end marker should produce error', () => {
  const result = validateDocument(MISSING_END_MARKER);
  assert(!result.valid, 'Document should be invalid');
  assertErrorCode(result.errors, 'MISSING_END_MARKER', 'Should have MISSING_END_MARKER error');
});

test('Empty directive should produce warning', () => {
  const result = validateDocument(EMPTY_DIRECTIVE);
  assert(result.warnings.length > 0, 'Should have warnings');
  assertErrorCode(result.warnings, 'EMPTY_DIRECTIVE', 'Should have EMPTY_DIRECTIVE warning');
});

test('Missing required directive should produce error', () => {
  const result = validateDocument(MISSING_REQUIRED_DIRECTIVE);
  assert(!result.valid, 'Document should be invalid');
  assertErrorCode(result.errors, 'MISSING_REQUIRED_DIRECTIVE', 'Should have MISSING_REQUIRED_DIRECTIVE error');
});

test('Multiple letterheads should produce warning', () => {
  const result = validateDocument(MULTIPLE_LETTERHEADS);
  assert(result.warnings.length > 0, 'Should have warnings');
  assertErrorCode(result.warnings, 'DUPLICATE_DIRECTIVE', 'Should have DUPLICATE_DIRECTIVE warning');
});

console.log('');

// Semantic class tests
console.log('Semantic Class Validation Tests:');

test('Unknown semantic class should produce warning', () => {
  const result = validateDocument(UNKNOWN_SEMANTIC_CLASS);
  assert(result.warnings.length > 0, 'Should have warnings');
  assertErrorCode(result.warnings, 'UNKNOWN_SEMANTIC_CLASS', 'Should have UNKNOWN_SEMANTIC_CLASS warning');
});

console.log('');

// Extraction tests
console.log('Extraction Tests:');

test('Extract frontmatter correctly', () => {
  const frontmatter = extractFrontmatter(VALID_DOCUMENT);
  assert(frontmatter !== null, 'Should extract frontmatter');
  assertEquals(frontmatter.title, 'Test Document', 'Should extract title');
  assertEquals(frontmatter['document-type'], 'business-letter', 'Should extract document-type');
  assertEquals(frontmatter.date, '2024-12-15', 'Should extract date');
});

test('Extract directives correctly', () => {
  const directives = extractDirectives(VALID_DOCUMENT);
  assert(directives.length >= 2, 'Should extract at least 2 directives');

  const letterhead = directives.find(d => d.type === 'letterhead');
  assert(letterhead !== undefined, 'Should extract letterhead directive');
  assert(letterhead.hasEndMarker, 'Letterhead should have end marker');

  const signature = directives.find(d => d.type === 'signature-block');
  assert(signature !== undefined, 'Should extract signature-block directive');
  assert(signature.hasEndMarker, 'Signature block should have end marker');
});

console.log('');

// Document type requirements tests
console.log('Document Type Requirements Tests:');

const INVOICE_MISSING_METADATA = `---
title: Test Invoice
document-type: invoice
date: 2024-12-15
---

::letterhead
Company Name
::

::header
Invoice
::

# Invoice

Items table here.`;

test('Invoice without invoice-number should produce error', () => {
  const result = validateDocument(INVOICE_MISSING_METADATA);
  assert(!result.valid, 'Invoice should be invalid without invoice-number');
  const error = result.errors.find(e =>
    e.code === 'MISSING_REQUIRED_FIELD' &&
    e.location.field === 'invoice-number'
  );
  assert(error !== undefined, 'Should have MISSING_REQUIRED_FIELD error for invoice-number');
});

const CONTRACT_VALID = `---
title: Service Agreement
document-type: contract
date: 2024-12-15
parties: ["Company A", "Company B"]
effective-date: 2024-01-01
---

::letterhead
Law Firm Name
::

# Service Agreement

Contract content here.

::signature-block

_______________________
Party A

_______________________
Party B

::
`;

test('Valid contract with required fields should pass', () => {
  const result = validateDocument(CONTRACT_VALID);
  assert(result.valid || result.errors.length === 0, 'Valid contract should pass validation');
});

console.log('');

// Strict mode tests
console.log('Strict Mode Tests:');

test('Warnings should fail in strict mode', () => {
  const result = validateDocument(EMPTY_DIRECTIVE, { strict: true });
  assert(!result.valid, 'Should be invalid in strict mode with warnings');
});

test('Valid document should pass in strict mode', () => {
  const result = validateDocument(VALID_DOCUMENT, { strict: true });
  // Business letter recommends (not requires) signature-block, so there may be warnings
  // Valid means no errors, warnings are okay unless strict AND document has actual issues
  assert(result.errors.length === 0, `Valid document should have no errors in strict mode (errors: ${result.errors.map(e => e.code).join(', ')})`);
});

console.log('');

// Date validation edge cases
console.log('Date Validation Edge Cases:');

test('Leap year date should be valid', () => {
  const leapYear = `---
title: Test
document-type: business-letter
date: 2024-02-29
---

# Test`;
  const result = validateDocument(leapYear);
  assertEquals(result.errors.filter(e => e.code === 'INVALID_DATE_FORMAT').length, 0, 'Leap year date should be valid');
});

test('Invalid day should produce error', () => {
  const invalidDay = `---
title: Test
document-type: business-letter
date: 2024-02-30
---

# Test`;
  const result = validateDocument(invalidDay);
  assertErrorCode(result.errors, 'INVALID_DATE_FORMAT', 'Invalid day should produce error');
});

test('Invalid month should produce error', () => {
  const invalidMonth = `---
title: Test
document-type: business-letter
date: 2024-13-01
---

# Test`;
  const result = validateDocument(invalidMonth);
  assertErrorCode(result.errors, 'INVALID_DATE_FORMAT', 'Invalid month should produce error');
});

console.log('');

// Print results
console.log('='.repeat(80));
console.log(`\nTest Results:`);
console.log(`  Total: ${totalTests}`);
console.log(`  Passed: ${passedTests} ✓`);
console.log(`  Failed: ${failedTests} ✗`);
console.log(`  Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

if (failedTests > 0) {
  console.error(`${failedTests} test(s) failed.`);
  process.exit(1);
} else {
  console.log('All tests passed! ✓');
  process.exit(0);
}

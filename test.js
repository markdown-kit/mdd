#!/usr/bin/env node
/**
 * MDD Test Suite
 * Tests that all example documents can be converted to HTML successfully
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const execAsync = promisify(exec);

const EXAMPLES = [
  'examples/business-letter.mdd',
  'examples/invoice.mdd',
  'examples/greek-document.mdd',
  'examples/comprehensive-document.mdd'
];

async function testExample(examplePath) {
  const htmlPath = examplePath.replace('.mdd', '.html');
  
  try {
    // Run preview command
    await execAsync(`node preview.js ${examplePath}`);
    
    // Check if HTML was generated
    if (!existsSync(resolve(htmlPath))) {
      throw new Error(`HTML file not generated: ${htmlPath}`);
    }
    
    console.log(`✓ ${examplePath} → ${htmlPath}`);
    return true;
  } catch (error) {
    console.error(`✗ ${examplePath}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('Running MDD Test Suite...\n');
  
  const results = await Promise.all(EXAMPLES.map(testExample));
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`\n${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n✓ All tests passed!');
    process.exit(0);
  } else {
    console.error('\n✗ Some tests failed');
    process.exit(1);
  }
}

runTests();

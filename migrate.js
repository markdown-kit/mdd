#!/usr/bin/env node

/**
 * mdd-migrate: rewrite MDD 2 documents into the MDD 3 spelling.
 *
 *   mdd-migrate <file.mdd> [...more]     rewrite in place
 *   mdd-migrate --check <file.mdd> [...] exit 1 if any file would change
 *   mdd-migrate --stdout <file.mdd>      print the result instead of writing
 */

import { readFile, writeFile } from 'node:fs/promises'
import { relative } from 'node:path'

import { migrateToMdd3 } from './lib/migrate.js'

const args = process.argv.slice(2)
const check = args.includes('--check')
const stdout = args.includes('--stdout')
const files = args.filter((arg) => !arg.startsWith('--'))

if (files.length === 0) {
  console.error('Usage: mdd-migrate [--check|--stdout] <file.mdd> [...more]')
  process.exit(2)
}

let wouldChange = 0
for (const file of files) {
  const before = await readFile(file, 'utf8')
  const { content, changed } = migrateToMdd3(before)
  const label = relative(process.cwd(), file) || file
  if (stdout) {
    process.stdout.write(content)
    continue
  }
  if (changed === 0) {
    console.log(`${label}: already MDD 3`)
    continue
  }
  wouldChange++
  if (check) {
    console.log(`${label}: ${changed} line(s) in the MDD 2 spelling`)
  } else {
    await writeFile(file, content)
    console.log(`${label}: rewrote ${changed} line(s)`)
  }
}

if (check && wouldChange > 0) process.exit(1)

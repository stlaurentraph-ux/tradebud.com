#!/usr/bin/env node
/**
 * Fail CI/dev if en.json or canonical-en-overrides.json contain Norwegian/Indonesian leaks.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findLocaleLeaks } from './i18n-en-guard.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const messagesDir = resolve(root, 'features/i18n/messages');
const en = JSON.parse(readFileSync(resolve(messagesDir, 'en.json'), 'utf8'));
const overrides = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'canonical-en-overrides.json'), 'utf8'),
);

const enLeaks = findLocaleLeaks(en);
const overrideLeaks = findLocaleLeaks(overrides);

let failed = false;

if (overrideLeaks.length > 0) {
  failed = true;
  console.error(`canonical-en-overrides.json — ${overrideLeaks.length} leak(s):`);
  for (const { key, value, reason } of overrideLeaks) {
    console.error(`  [${reason}] ${key}: ${value}`);
  }
}

if (enLeaks.length > 0) {
  failed = true;
  console.error(`en.json — ${enLeaks.length} leak(s):`);
  for (const { key, value, reason } of enLeaks) {
    console.error(`  [${reason}] ${key}: ${value}`);
  }
}

if (failed) {
  console.error('\nRun: node scripts/rebuild-en-locale.mjs');
  process.exit(1);
}

console.log(`en.json OK — ${Object.keys(en).length} keys, 0 locale leaks`);
process.exit(0);

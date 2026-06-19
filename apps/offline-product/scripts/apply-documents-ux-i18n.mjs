#!/usr/bin/env node
/**
 * Apply documents UX i18n strings across locale message files.
 * Run: node scripts/apply-documents-ux-i18n.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentsUxPatches } from './documents-ux-i18n-patches.mjs';
import { documentsUxKeys } from './documents-ux-i18n-patches.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const messagesDir = resolve(root, 'features/i18n/messages');
const en = JSON.parse(readFileSync(resolve(messagesDir, 'en.json'), 'utf8'));
const locales = readdirSync(messagesDir)
  .filter((f) => f.endsWith('.json') && f !== 'en.json')
  .map((f) => f.replace(/\.json$/, ''));

let changed = 0;
for (const locale of locales) {
  const patch = documentsUxPatches[locale];
  if (!patch) {
    console.error(`Missing patch block for ${locale}`);
    process.exit(1);
  }
  const filePath = resolve(messagesDir, `${locale}.json`);
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  let fileChanged = false;
  for (const key of documentsUxKeys) {
    const next = patch[key] ?? en[key];
    if (!next) {
      console.error(`No value for ${locale}.${key}`);
      process.exit(1);
    }
    if (data[key] !== next) {
      data[key] = next;
      fileChanged = true;
    }
  }
  if (fileChanged) {
    writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    changed += 1;
    console.log(`updated ${locale}.json`);
  }
}

console.log(changed === 0 ? 'all locales already up to date' : `updated ${changed} locale file(s)`);

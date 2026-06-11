#!/usr/bin/env node
/**
 * Ensures every locale JSON has all keys from en.json (English fallback for gaps).
 * Run after adding keys to en.json: node scripts/build-app-locale-files.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const messagesDir = resolve(root, 'features/i18n/messages');
const en = JSON.parse(readFileSync(resolve(messagesDir, 'en.json'), 'utf8'));
const enKeys = Object.keys(en);

// Norwegian (no) is intentionally excluded from the field app picker — file kept for tooling only.
const locales = ['fr', 'es', 'pt', 'id', 'vi', 'de', 'nl', 'it', 'am', 'hi', 'ar', 'rw', 'lg', 'sw'];

for (const locale of locales) {
  const path = resolve(messagesDir, `${locale}.json`);
  const existing = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
  const merged = {};
  for (const key of enKeys) {
    merged[key] = existing[key] ?? en[key];
  }
  writeFileSync(path, `${JSON.stringify(merged, null, 2)}\n`);
  const translated = enKeys.filter((k) => existing[k] && existing[k] !== en[k]).length;
  console.log(`${locale}.json — ${translated}/${enKeys.length} non-English strings`);
}

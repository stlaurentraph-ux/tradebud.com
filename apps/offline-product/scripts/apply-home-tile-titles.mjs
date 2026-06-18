#!/usr/bin/env node
/**
 * Apply short home-tile titles across locale message files (same contract as EN).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const messagesDir = path.join(root, 'features/i18n/messages');
const overrides = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts/home-tile-title-overrides.json'), 'utf8'),
);

const tileKeys = Object.keys(overrides);
const locales = fs
  .readdirSync(messagesDir)
  .filter((f) => f.endsWith('.json') && f !== 'en.json')
  .map((f) => f.replace(/\.json$/, ''));

let changed = 0;
for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let fileChanged = false;
  for (const key of tileKeys) {
    const next = overrides[key]?.[locale];
    if (!next) {
      console.error(`Missing override for ${locale}.${key}`);
      process.exit(1);
    }
    if (data[key] !== next) {
      data[key] = next;
      fileChanged = true;
    }
  }
  if (fileChanged) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    changed += 1;
    console.log(`updated ${locale}.json`);
  }
}

console.log(changed === 0 ? 'all locales already up to date' : `updated ${changed} locale file(s)`);

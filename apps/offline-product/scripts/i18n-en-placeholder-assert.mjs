#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const enPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../features/i18n/messages/en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const bad = Object.entries(en).filter(([k, v]) => k === v).map(([k]) => k);
if (bad.length > 0) {
  console.error(`en.json has ${bad.length} placeholder key(s): ${bad.slice(0, 10).join(', ')}`);
  process.exit(1);
}
console.log(`en.json OK (${Object.keys(en).length} keys, no placeholders)`);

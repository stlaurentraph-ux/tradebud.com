#!/usr/bin/env node
/** Writes scripts/lg-pass2.json from scripts/lg-pass2-source.json */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const source = resolve(dir, 'lg-pass2-source.json');
const fixes = JSON.parse(readFileSync(source, 'utf8'));
writeFileSync(resolve(dir, 'lg-pass2.json'), `${JSON.stringify(fixes, null, 2)}\n`);
console.log(`Wrote ${Object.keys(fixes).length} pass-2 fixes`);

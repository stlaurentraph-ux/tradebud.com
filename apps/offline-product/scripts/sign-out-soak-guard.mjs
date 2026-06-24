#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const issues = [];
if (!fs.existsSync(path.join(root, '.maestro/flows/sign-out-persistence-smoke.yaml'))) {
  issues.push('missing sign-out-persistence-smoke.yaml');
}
if (!read('features/auth/fieldAppEligibility.ts').includes('may also use the field app')) {
  issues.push('fieldAppEligibility dual-use docs');
}
if (!read('qa/automation-baselines/maestro-nightly-smoke.json').includes('sign-out-persistence-smoke.yaml')) {
  issues.push('nightly manifest missing sign-out flow');
}
if (issues.length) {
  console.error('sign-out-soak-guard: FAILED\n' + issues.map((i) => `  → ${i}`).join('\n'));
  process.exit(1);
}
console.log('sign-out-soak-guard: OK');

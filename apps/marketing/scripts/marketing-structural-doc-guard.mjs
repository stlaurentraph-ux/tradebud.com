#!/usr/bin/env node
/**
 * Ensures marketing structural contracts doc references baseline guards.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

const REQUIRED_ASSERTS = [
  'i18n:parity:assert',
  'routes:publication:assert',
  'analytics:slice:assert',
  'e2e:golden-paths:assert',
  'lighthouse:budgets:assert',
  'seo:smoke:assert',
];

function main() {
  const issues = [];
  const mdPath = path.join(repoRoot, 'product-os/04-quality/marketing-structural-contracts.md');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  if (!fs.existsSync(mdPath)) {
    issues.push('missing marketing-structural-contracts.md');
  } else {
    const md = fs.readFileSync(mdPath, 'utf8');
    for (const script of REQUIRED_ASSERTS) {
      if (!md.includes(script)) {
        issues.push(`marketing-structural-contracts.md missing script: ${script}`);
      }
      if (!pkg.scripts[script]) {
        issues.push(`package.json missing script: ${script}`);
      }
    }
  }

  if (issues.length === 0) {
    console.log('marketing-structural-doc-guard: OK');
    process.exit(0);
  }

  console.error('marketing-structural-doc-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();

#!/usr/bin/env node
/**
 * Marketing structural contract orchestrator (wraps existing assert guards).
 * Run: npm run qa:structural (local full) | npm run qa:structural:ci (doc guard only)
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ci = process.argv.includes('--ci');

const npmGuards = [
  'i18n:parity:assert',
  'routes:publication:assert',
  'analytics:slice:assert',
  'insights:lint:assert',
  'insights:seo:assert',
  'png:size:assert',
  'api:trace:size:assert',
  'e2e:golden-paths:assert',
  'a11y:routes:assert',
  'lighthouse:budgets:assert',
  'seo:smoke:assert',
  'smoke:post-deploy:assert',
  'email:templates:smoke:assert',
];

let failed = 0;

if (ci) {
  console.log('\n=== marketing-structural-doc-guard.mjs ===');
  const doc = spawnSync(process.execPath, [path.join(root, 'scripts', 'marketing-structural-doc-guard.mjs')], {
    cwd: root,
    stdio: 'inherit',
  });
  if (doc.status !== 0) failed += 1;
} else {
  for (const script of npmGuards) {
    console.log(`\n=== ${script} ===`);
    const result = spawnSync('npm', ['run', script], {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: process.env,
    });
    if (result.status !== 0) failed += 1;
  }
}

if (failed > 0) {
  console.error(`\nrun-structural-guards: ${failed} guard(s) failed.`);
  process.exit(1);
}

console.log('\nrun-structural-guards: OK');
process.exit(0);

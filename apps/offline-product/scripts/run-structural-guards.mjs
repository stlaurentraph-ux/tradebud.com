#!/usr/bin/env node
/**
 * Orchestrates structural / contract guards (registry parity, sync symmetry, feature docs).
 * Run: npm run qa:structural
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const guards = [
  'sync-parity-guard.mjs',
  'registry-md-parity-guard.mjs',
  'pending-sync-registry-guard.mjs',
  'feature-doc-guard.mjs',
];

const args = process.argv.slice(2);
const ci = args.includes('--ci');

let failed = 0;

for (const guard of guards) {
  const guardPath = path.join(root, 'scripts', guard);
  const guardArgs = ci ? ['--ci'] : [];

  console.log(`\n=== ${guard} ===`);
  const result = spawnSync(process.execPath, [guardPath, ...guardArgs], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\nrun-structural-guards: ${failed} guard(s) failed.`);
  process.exit(1);
}

console.log('\nrun-structural-guards: OK');
process.exit(0);

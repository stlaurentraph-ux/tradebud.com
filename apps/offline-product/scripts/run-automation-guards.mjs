#!/usr/bin/env node
/**
 * Offline Phase 1 automation guard orchestrator.
 * Report mode (default): print deltas vs baseline; exit 0 unless --strict.
 * --write-baseline: refresh qa/automation-baselines/*.json snapshots.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const guards = [
  'mobile-api-openapi-parity.mjs',
  'ota-native-fingerprint-gate.mjs',
  'analytics-slice-guard.mjs',
];

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const writeBaseline = args.includes('--write-baseline');

let failed = 0;

for (const guard of guards) {
  const guardPath = path.join(root, 'scripts', guard);
  const guardArgs = [];
  if (strict) guardArgs.push('--strict');
  if (writeBaseline) guardArgs.push('--write-baseline');

  console.log(`\n=== ${guard} ===`);
  const result = spawnSync(process.execPath, [guardPath, ...guardArgs], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    failed += 1;
    if (strict) break;
  }
}

if (failed > 0) {
  console.error(`\nrun-automation-guards: ${failed} guard(s) failed${strict ? ' (strict)' : ''}.`);
  process.exit(strict ? 1 : 0);
}

console.log('\nrun-automation-guards: OK');
process.exit(0);

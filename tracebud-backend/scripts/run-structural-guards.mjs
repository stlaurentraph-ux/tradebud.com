#!/usr/bin/env node
/**
 * Backend structural contract orchestrator.
 * Run: npm run qa:structural | npm run qa:structural:ci
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ci = process.argv.includes('--ci');
const guardArgs = ci ? ['--ci'] : [];

const guards = [
  ['backend-role-guard.mjs', []],
  ['backend-audit-event-guard.mjs', guardArgs],
  ['backend-filing-state-guard.mjs', []],
  ['backend-plot-compliance-guard.mjs', []],
  ['backend-api-access-guard.mjs', []],
  ['backend-deploy-smoke-guard.mjs', []],
  ['stripe-webhook-replay-guard.mjs', []],
  ['docker-vendor-parity-guard.mjs', []],
  ['check-tenure-parse-readiness.mjs', ['--static-only']],
];

let failed = 0;

for (const [guard, args] of guards) {
  console.log(`\n=== ${guard} ===`);
  const script = guard.startsWith('check-')
    ? path.join(root, 'scripts', guard)
    : path.join(root, 'scripts', guard);
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) failed += 1;
}

if (ci) {
  console.log('\n=== benchmark-admin claims (CI) ===');
  const bench = spawnSync(process.execPath, [path.join(root, 'scripts', 'check-benchmark-admin-claims.mjs')], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (bench.status !== 0) failed += 1;
} else {
  console.log('\n=== benchmark-admin claims (optional locally) ===');
  const bench = spawnSync(
    process.execPath,
    [
      path.join(root, 'scripts', 'backend-optional-env-guard.mjs'),
      'BENCHMARK_ADMIN_ROLE_CLAIMS',
      'check-benchmark-admin-claims.mjs',
    ],
    { cwd: root, stdio: 'inherit', env: process.env },
  );
  if (bench.status !== 0) failed += 1;
}

if (failed > 0) {
  console.error(`\nrun-structural-guards: ${failed} guard(s) failed.`);
  process.exit(1);
}

console.log('\nrun-structural-guards: OK');
process.exit(0);

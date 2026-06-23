#!/usr/bin/env node
/**
 * Dashboard structural contract orchestrator.
 * Run: npm run qa:structural
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const guards = [
  'dashboard-rbac-guard.mjs',
  'dashboard-shipment-transition-guard.mjs',
  'dashboard-regression-guard.mjs',
  'dashboard-openapi-codegen-guard.mjs',
  'dashboard-proxy-contract-guard.mjs',
  'dashboard-mock-vs-real-guard.mjs',
  'dashboard-playwright-guard.mjs',
  'dashboard-onboarding-smoke-guard.mjs',
];

let failed = 0;

for (const guard of guards) {
  console.log(`\n=== ${guard} ===`);
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', guard)], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) failed += 1;
}

if (failed > 0) {
  console.error(`\nrun-structural-guards: ${failed} guard(s) failed.`);
  process.exit(1);
}

console.log('\nrun-structural-guards: OK');
process.exit(0);

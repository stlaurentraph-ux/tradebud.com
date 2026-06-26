#!/usr/bin/env node
/**
 * Dashboard structural contract orchestrator.
 * Run: npm run qa:structural | npm run qa:structural:ci
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ci = process.argv.includes('--ci');

const guards = [
  'dashboard-backend-network-parity-guard.mjs',
  'dashboard-crm-guard.mjs',
  'dashboard-campaign-guard.mjs',
  'dashboard-network-permission-guard.mjs',
  'dashboard-feature-gate-guard.mjs',
  'dashboard-audit-parity-guard.mjs',
  'dashboard-compliance-issues-guard.mjs',
  'dashboard-compliance-permission-guard.mjs',
  'dashboard-compliance-backend-parity-guard.mjs',
  'dashboard-exporter-workflow-guard.mjs',
  'dashboard-mapping-workflow-guard.mjs',
  'dashboard-rbac-guard.mjs',
  'dashboard-shipment-transition-guard.mjs',
  'dashboard-legal-workflow-guard.mjs',
  'dashboard-permission-matrix-guard.mjs',
  'dashboard-backend-role-parity-guard.mjs',
  ['dashboard-analytics-slice-guard.mjs', ci ? ['--ci'] : []],
  'dashboard-regression-guard.mjs',
  'dashboard-openapi-codegen-guard.mjs',
  'dashboard-proxy-contract-guard.mjs',
  'dashboard-mock-vs-real-guard.mjs',
  'dashboard-playwright-guard.mjs',
  'dashboard-onboarding-smoke-guard.mjs',
];

let failed = 0;

for (const entry of guards) {
  const [guard, args = []] = Array.isArray(entry) ? entry : [entry, []];
  console.log(`\n=== ${guard} ===`);
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', guard), ...args], {
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

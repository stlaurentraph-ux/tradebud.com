#!/usr/bin/env node
/**
 * Apply or verify TB-V16-061–063 supplier/campaign onboarding migrations in order.
 *
 * Run: npm run db:apply:supplier-campaign-onboarding -w tracebud-backend
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const verifyOnly = process.argv.includes('--verify-only');
const flag = verifyOnly ? '--verify-only' : '';

const steps = [
  'apply-campaign-recipient-invites-migration.mjs',
  'apply-campaign-recipient-farmer-claim-migration.mjs',
  'apply-enumeration-mapping-region-migration.mjs',
  'apply-crm-farmer-phone-reachability-migration.mjs',
];

for (const script of steps) {
  console.log(`\n=== ${script} ${flag}`.trim());
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', script), flag].filter(Boolean), {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(
  verifyOnly
    ? 'Verified all supplier campaign onboarding migrations.'
    : 'Applied all supplier campaign onboarding migrations.',
);

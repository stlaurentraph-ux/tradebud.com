#!/usr/bin/env node
/**
 * Run EAS Build uploading only apps/offline-product (~6 MB), not the full monorepo.
 * Default git-based archive pulls the whole repo (~1.5 GB marketing assets) and
 * often fails mid-upload (ECONNRESET).
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/eas-build.mjs --platform ios --profile preview');
  process.exit(1);
}

const result = spawnSync('npx', ['eas-cli', 'build', '--verbose-logs', ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    EAS_NO_VCS: '1',
    EAS_PROJECT_ROOT: projectRoot,
  },
});

process.exit(result.status ?? 1);

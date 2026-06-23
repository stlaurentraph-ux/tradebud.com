#!/usr/bin/env node
/**
 * Optional-env guard wrapper — skips when required env is unset (local dev).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ci = process.argv.includes('--ci');
const envVar = process.env[process.argv[2]];

if (!envVar?.trim()) {
  if (ci) {
    console.error(`${process.argv[2]} is required in CI for ${path.basename(process.argv[3])}`);
    process.exit(1);
  }
  console.log(`${path.basename(process.argv[3])}: skipped (${process.argv[2]} unset locally)`);
  process.exit(0);
}

const result = spawnSync(process.execPath, [path.join(root, 'scripts', process.argv[3])], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);

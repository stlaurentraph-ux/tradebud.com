#!/usr/bin/env node
/**
 * Guard Sentry mobile alert manifest wiring (offline observability Phase A).
 *
 * Run: npm run sentry:alerts:assert
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const offlineRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const result = spawnSync(process.execPath, ['scripts/check-sentry-mobile-alerts.mjs'], {
    cwd: offlineRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  console.log('Sentry mobile alerts guard passed.');
}

main();

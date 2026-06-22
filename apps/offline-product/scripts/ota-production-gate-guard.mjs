#!/usr/bin/env node
/**
 * Guard production OTA gate wiring (slice 5.10).
 *
 * Run: npm run ota:production:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const offlineRoot = path.join(repoRoot, 'apps/offline-product');

function readRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function main() {
  const manifest = JSON.parse(readRepo('product-os/04-quality/ota-production-gate.json'));
  if (manifest.schemaVersion !== 1 || manifest.slice !== '5.10') {
    throw new Error('ota-production-gate.json must be schemaVersion 1 slice 5.10');
  }

  for (const file of [
    'apps/offline-product/scripts/eas-ota-skew-guard.mjs',
    'apps/offline-product/scripts/ota-production-preflight.mjs',
    'apps/offline-product/scripts/ota-production-maestro-optional.sh',
    manifest.workflowFile,
  ]) {
    if (!fs.existsSync(path.join(repoRoot, file))) {
      throw new Error(`Missing required file: ${file}`);
    }
  }

  const pkg = JSON.parse(readRepo('apps/offline-product/package.json'));
  for (const script of [
    'ota:skew:assert',
    'ota:production:preflight',
    'ota:production:assert',
    'update:production:safe',
  ]) {
    if (!pkg.scripts?.[script]) {
      throw new Error(`apps/offline-product/package.json must define ${script}`);
    }
  }

  const workflow = readRepo(manifest.workflowFile);
  if (!workflow.includes('ota:production:preflight') || !workflow.includes('ota:production:assert')) {
    throw new Error(`${manifest.workflowFile} must run ota production preflight/assert`);
  }

  const ci = readRepo('.github/workflows/ci.yml');
  if (!ci.includes('ota:production:assert')) {
    throw new Error('ci.yml app job must run ota:production:assert');
  }

  const updateSafe = pkg.scripts['update:production:safe'];
  if (!updateSafe.includes('ota:production:preflight')) {
    throw new Error('update:production:safe must run ota:production:preflight before update:production');
  }

  const skew = spawnSync(process.execPath, ['scripts/eas-ota-skew-guard.mjs'], {
    cwd: offlineRoot,
    encoding: 'utf8',
  });
  if (skew.status !== 0) {
    throw new Error(`eas-ota-skew-guard failed during assert:\n${skew.stdout}\n${skew.stderr}`);
  }

  console.log('OTA production gate guard passed.');
}

main();

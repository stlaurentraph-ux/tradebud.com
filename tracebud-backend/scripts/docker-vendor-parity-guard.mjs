#!/usr/bin/env node
/**
 * Ensures tracebud-backend/vendor/import-v1-canonical matches packages/tracebud-import-v1-canonical.
 */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(backendRoot, '..');
const files = ['index.cjs', 'index.d.ts', 'package.json'];

function digest(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

let failed = false;

for (const file of files) {
  const canonical = path.join(repoRoot, 'packages/tracebud-import-v1-canonical', file);
  const vendor = path.join(backendRoot, 'vendor/import-v1-canonical', file);
  if (!existsSync(canonical) || !existsSync(vendor)) {
    console.error(`docker-vendor-parity-guard: missing file for ${file}`);
    failed = true;
    continue;
  }
  const left = digest(canonical);
  const right = digest(vendor);
  if (left !== right) {
    console.error(
      `docker-vendor-parity-guard: vendor/import-v1-canonical/${file} is out of sync with packages/tracebud-import-v1-canonical/${file}`,
    );
    failed = true;
  }
}

const backendPkgPath = path.join(backendRoot, 'package.json');
const backendPkg = JSON.parse(readFileSync(backendPkgPath, 'utf8'));
if (backendPkg.dependencies?.['@tracebud/import-v1-canonical'] !== 'file:./vendor/import-v1-canonical') {
  console.error(
    'docker-vendor-parity-guard: tracebud-backend/package.json must depend on file:./vendor/import-v1-canonical',
  );
  failed = true;
}

if (failed) {
  console.error(
    'docker-vendor-parity-guard: copy packages/tracebud-import-v1-canonical into tracebud-backend/vendor/import-v1-canonical',
  );
  process.exit(1);
}

console.log('docker-vendor-parity-guard: OK');

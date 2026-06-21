#!/usr/bin/env node
/**
 * Generate dashboard proxy consumer types from canonical OpenAPI draft (slice 4.1).
 *
 * Run: npm run openapi:codegen -w dashboard-product
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dashboardRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(dashboardRoot, '../..');
const manifestPath = path.join(
  dashboardRoot,
  'qa/automation-baselines/dashboard-openapi-codegen.json',
);
const redoclyConfig = path.join(repoRoot, '.redocly.yaml');

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function main() {
  const manifest = loadManifest();
  const outputPath = path.join(dashboardRoot, manifest.generatedTypesFile);

  if (!fs.existsSync(redoclyConfig)) {
    throw new Error('Missing .redocly.yaml at repo root');
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['openapi-typescript', '--redocly', redoclyConfig],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env,
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error(`Expected generated types at ${manifest.generatedTypesFile}`);
  }

  console.log(`Generated OpenAPI proxy types → ${path.relative(dashboardRoot, outputPath)}`);
}

main();

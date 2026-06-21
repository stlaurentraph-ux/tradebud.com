#!/usr/bin/env node
/**
 * Generate offline mobile API client types from canonical OpenAPI draft (slice 4.2).
 *
 * Run: npm run openapi:codegen
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const offlineRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(offlineRoot, '../..');
const manifestPath = path.join(offlineRoot, 'qa/automation-baselines/mobile-openapi-codegen.json');

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function main() {
  const manifest = loadManifest();
  const specPath = path.join(repoRoot, manifest.openapiSpec);
  const outputPath = path.join(offlineRoot, manifest.generatedTypesFile);

  if (!fs.existsSync(specPath)) {
    throw new Error(`Missing OpenAPI spec at ${manifest.openapiSpec}`);
  }

  const redoclyConfig = path.join(repoRoot, '.redocly.yaml');
  if (!fs.existsSync(redoclyConfig)) {
    throw new Error('Missing .redocly.yaml at repo root');
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['openapi-typescript', 'tracebud-offline', '--redocly', redoclyConfig],
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

  console.log(`Generated OpenAPI client types → ${path.relative(offlineRoot, outputPath)}`);
}

main();

#!/usr/bin/env node
/**
 * Ensures cross-device UI surfaces reload after restoreFarmerCloudState.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryTs = path.join(root, 'features/sync/farmerArtifactRegistry.ts');

function extractUiReloadEntries(source) {
  const match = source.match(
    /export const FARMER_ARTIFACT_UI_RELOAD_FILES = \[([\s\S]*?)\] as const;/,
  );
  if (!match) return [];
  const entries = [];
  const blocks = match[1].matchAll(/\{\s*file:\s*'([^']+)'[\s\S]*?patterns:\s*\[([\s\S]*?)\],?\s*\}/g);
  for (const block of blocks) {
    const file = block[1];
    const patterns = [...block[2].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    entries.push({ file, patterns });
  }
  return entries;
}

function main() {
  const issues = [];
  if (!fs.existsSync(registryTs)) {
    console.error('ui-reload-guard: missing farmerArtifactRegistry.ts');
    process.exit(1);
  }

  const entries = extractUiReloadEntries(fs.readFileSync(registryTs, 'utf8'));
  if (entries.length === 0) {
    issues.push('FARMER_ARTIFACT_UI_RELOAD_FILES is empty or unparsable');
  }

  for (const entry of entries) {
    const filePath = path.join(root, entry.file);
    if (!fs.existsSync(filePath)) {
      issues.push(`missing UI file: ${entry.file}`);
      continue;
    }
    const src = fs.readFileSync(filePath, 'utf8');
    for (const pattern of entry.patterns) {
      if (!src.includes(pattern)) {
        issues.push(`${entry.file} missing reload pattern: ${pattern}`);
      }
    }
  }

  if (issues.length === 0) {
    console.log('ui-reload-guard: OK');
    process.exit(0);
  }

  console.error('ui-reload-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();

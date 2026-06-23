#!/usr/bin/env node
/**
 * Ensures Settings Sync now picks push_only vs full restore via resolveFieldSyncMode.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function main() {
  const issues = [];
  const settings = read('app/(tabs)/settings.tsx');
  const pipeline = read('features/sync/runFieldSyncPipeline.ts');
  const resolveMode = read('features/sync/resolveFieldSyncMode.ts');

  if (!fs.existsSync(path.join(root, 'features/sync/resolveFieldSyncMode.test.ts'))) {
    issues.push('missing resolveFieldSyncMode.test.ts');
  }
  if (!resolveMode.includes('push_only') || !resolveMode.includes('full')) {
    issues.push('resolveFieldSyncMode must define push_only and full');
  }
  if (!settings.includes('resolveFieldSyncMode')) {
    issues.push('settings.tsx must call resolveFieldSyncMode before runFieldSyncPipeline');
  }
  if (!settings.includes('syncMode')) {
    issues.push('settings.tsx must pass syncMode to runFieldSyncPipeline');
  }
  if (!pipeline.includes('syncMode')) {
    issues.push('runFieldSyncPipeline must accept syncMode');
  }
  if (!pipeline.includes("syncMode === 'full'")) {
    issues.push('runFieldSyncPipeline must branch on syncMode full vs push_only');
  }

  if (issues.length === 0) {
    console.log('field-sync-mode-guard: OK');
    process.exit(0);
  }

  console.error('field-sync-mode-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();

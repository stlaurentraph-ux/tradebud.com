#!/usr/bin/env node
/**
 * Ensures farmer artifact registry matches sync pipeline wiring.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function extractNames(source, exportName) {
  const match = source.match(new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function main() {
  const issues = [];
  const registry = read('features/sync/farmerArtifactRegistry.ts');
  const pipeline = read('features/sync/runFieldSyncPipeline.ts');
  const orchestrator = read('features/sync/restoreFarmerCloudState.ts');
  const queue = read('features/sync/processPendingSyncQueue.ts');
  const prefs = read('features/sync/syncFieldDevicePreferences.ts');

  const restoreModules = extractNames(registry, 'FARMER_ARTIFACT_RESTORE_MODULES');
  const uploadActions = extractNames(registry, 'PENDING_SYNC_UPLOAD_ACTION_TYPES');

  if (!pipeline.includes('restoreFarmerCloudState')) {
    issues.push('runFieldSyncPipeline must call restoreFarmerCloudState');
  }
  if (!pipeline.includes('enqueueFarmerCloudSyncActions')) {
    issues.push('runFieldSyncPipeline must call enqueueFarmerCloudSyncActions');
  }

  for (const mod of restoreModules) {
    if (mod === 'restoreLocalPlotsFromServer' || mod === 'restoreLocalDeliveryReceiptsFromServer') {
      if (!pipeline.includes(mod)) issues.push(`pipeline missing ${mod}`);
      continue;
    }
    if (!orchestrator.includes(mod)) {
      issues.push(`restoreFarmerCloudState missing ${mod}`);
    }
  }

  if (!prefs.includes('restoreMissingOfflineTilePacksFromServer')) {
    issues.push('offline tile restore must be wired in syncFieldDevicePreferences');
  }

  for (const actionType of uploadActions) {
    if (!queue.includes(`'${actionType}'`)) {
      issues.push(`processPendingSyncQueue missing ${actionType}`);
    }
  }

  const mdPath = path.join(root, '../../product-os/04-quality/farmer-artifact-sync-registry.md');
  if (!fs.existsSync(mdPath)) {
    issues.push('missing product-os/04-quality/farmer-artifact-sync-registry.md');
  }

  if (issues.length === 0) {
    console.log('sync-parity-guard: OK');
    process.exit(0);
  }

  console.error('sync-parity-guard: FAILED\n');
  for (const hint of issues) console.error(`  → ${hint}`);
  process.exit(1);
}

main();

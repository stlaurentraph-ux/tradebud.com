#!/usr/bin/env node
/**
 * Ensures device-local inbound/outbound marker module is wired into sync prep.
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
  const registry = read('features/sync/farmerArtifactRegistry.ts');
  const pipeline = read('features/sync/runFieldSyncPipeline.ts');
  const markers = read('features/sync/deviceSyncMarkers.ts');
  const hydrate = read('features/sync/hydrateLocalSyncMarkersFromServer.ts');

  if (!registry.includes('INBOUND_HYDRATED_MARKER_PREFIX')) {
    issues.push('farmerArtifactRegistry.ts must export INBOUND_HYDRATED_MARKER_PREFIX');
  }
  if (!registry.includes('DEVICE_SYNC_MARKER_HYDRATE_MODULE')) {
    issues.push('farmerArtifactRegistry.ts must export DEVICE_SYNC_MARKER_HYDRATE_MODULE');
  }
  if (!pipeline.includes('hydrateLocalSyncMarkersFromServer')) {
    issues.push('runFieldSyncPipeline must call hydrateLocalSyncMarkersFromServer before prune');
  }
  if (!markers.includes('markInboundHydrated')) {
    issues.push('deviceSyncMarkers.ts must export markInboundHydrated');
  }
  if (!hydrate.includes('markInboundHydrated')) {
    issues.push('hydrateLocalSyncMarkersFromServer must set inbound hydrate markers');
  }
  if (!hydrate.includes('hydrateMediaUploadMarkersFromServer')) {
    issues.push('hydrateLocalSyncMarkersFromServer must hydrate outbound media markers');
  }

  if (issues.length === 0) {
    console.log('device-sync-markers-guard: OK');
    process.exit(0);
  }

  console.error('device-sync-markers-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();

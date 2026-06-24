#!/usr/bin/env node
/**
 * Ensures farmer-scoped cloud audit sync uses deferPost/skipIfSynced during sync prep.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function main() {
  const issues = [];
  const registry = read('features/sync/farmerArtifactRegistry.ts');
  const enqueue = read('features/sync/enqueueFarmerCloudSyncActions.ts');
  const pipeline = read('features/sync/runFieldSyncPipeline.ts');
  const cloudQueue = read('features/sync/queueFieldCloudAuditSync.ts');
  const processQueue = read('features/sync/processPendingSyncQueue.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/farmer-artifact-sync-registry.md');
  const stateMdPath = path.join(repoRoot, 'product-os/04-quality/field-state-transition-registry.md');

  if (!registry.includes('FARMER_CLOUD_SYNC_PREP_OPTIONS')) {
    issues.push('farmerArtifactRegistry.ts must export FARMER_CLOUD_SYNC_PREP_OPTIONS');
  }
  if (!registry.includes('FIELD_CLOUD_AUDIT_SYNC_MARKER_PREFIX')) {
    issues.push('farmerArtifactRegistry.ts must export FIELD_CLOUD_AUDIT_SYNC_MARKER_PREFIX');
  }
  if (!enqueue.includes('FARMER_CLOUD_SYNC_PREP_OPTIONS')) {
    issues.push('enqueueFarmerCloudSyncActions must use FARMER_CLOUD_SYNC_PREP_OPTIONS from registry');
  }
  if (!pipeline.includes('enqueueFarmerCloudSyncActions')) {
    issues.push('runFieldSyncPipeline must call enqueueFarmerCloudSyncActions');
  }
  if (!pipeline.includes('processPendingSyncQueue')) {
    issues.push('runFieldSyncPipeline must call processPendingSyncQueue after sync prep');
  }
  const enqueueIdx = pipeline.indexOf('enqueueFarmerCloudSyncActions');
  const drainIdx = pipeline.indexOf('drainPendingSyncQueueForManualSync');
  if (enqueueIdx >= 0 && drainIdx >= 0 && enqueueIdx < drainIdx) {
    issues.push('enqueueFarmerCloudSyncActions must run after drainPendingSyncQueueForManualSync');
  }
  for (const fn of ['isFieldCloudAuditSynced', 'markFieldCloudAuditSynced']) {
    if (!cloudQueue.includes(`export async function ${fn}`)) {
      issues.push(`queueFieldCloudAuditSync.ts must export ${fn}`);
    }
  }
  if (!processQueue.includes('processAuditSyncActionsBatch')) {
    issues.push('processPendingSyncQueue must batch audit_sync via processAuditSyncActionsBatch');
  }
  const batchProcessor = read('features/sync/processAuditSyncActionsBatch.ts');
  if (!batchProcessor.includes('markFieldCloudAuditSynced')) {
    issues.push('processAuditSyncActionsBatch must mark field cloud audit synced on success');
  }
  if (!batchProcessor.includes('markDeclarationAuditSynced')) {
    issues.push('processAuditSyncActionsBatch must mark declaration audit synced on success');
  }

  if (!fs.existsSync(mdPath)) {
    issues.push('missing farmer-artifact-sync-registry.md');
  } else {
    const md = fs.readFileSync(mdPath, 'utf8');
    if (!md.includes('FARMER_CLOUD_SYNC_PREP_OPTIONS') && !md.includes('deferPost')) {
      issues.push('farmer-artifact-sync-registry.md must document sync prep deferPost/skipIfSynced');
    }
  }
  if (!fs.existsSync(stateMdPath)) {
    issues.push('missing field-state-transition-registry.md');
  } else {
    const md = fs.readFileSync(stateMdPath, 'utf8');
    if (!md.includes('audit_cloud_synced')) {
      issues.push('field-state-transition-registry.md must document audit_cloud_synced markers');
    }
  }

  const testPath = path.join(root, 'features/sync/enqueueFarmerCloudSyncActions.test.ts');
  if (!fs.existsSync(testPath)) {
    issues.push('missing enqueueFarmerCloudSyncActions.test.ts');
  }

  if (issues.length === 0) {
    console.log('cloud-audit-sync-guard: OK');
    process.exit(0);
  }

  console.error('cloud-audit-sync-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();

#!/usr/bin/env node
/**
 * Ensures manual sync drains upload queue rows before audit_sync (land docs before declarations).
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
  const priority = read('features/sync/pendingSyncQueuePriority.ts');
  const processQueue = read('features/sync/processPendingSyncQueue.ts');
  const drain = read('features/sync/drainPendingSyncQueue.ts');
  const pipeline = read('features/sync/runFieldSyncPipeline.ts');
  const smokePath = path.join(root, 'DEVICE_SMOKE_CHECKLIST.md');

  if (!priority.includes('comparePendingSyncActionsForDrain')) {
    issues.push('pendingSyncQueuePriority.ts must export comparePendingSyncActionsForDrain');
  }
  if (!priority.includes('photos_sync: 1') || !priority.includes('audit_sync: 3')) {
    issues.push('pendingSyncQueuePriority.ts must rank photos_sync before audit_sync');
  }
  if (!processQueue.includes('comparePendingSyncActionsForDrain')) {
    issues.push('processPendingSyncQueue must sort with comparePendingSyncActionsForDrain');
  }
  if (!drain.includes('MANUAL_SYNC_UPLOAD_ACTION_TYPES')) {
    issues.push('drainPendingSyncQueue must drain MANUAL_SYNC_UPLOAD_ACTION_TYPES first');
  }
  if (!drain.includes('MANUAL_SYNC_AUDIT_ACTION_TYPES')) {
    issues.push('drainPendingSyncQueue must drain MANUAL_SYNC_AUDIT_ACTION_TYPES after uploads');
  }

  const enqueueIdx = pipeline.indexOf('enqueueFarmerCloudSyncActions');
  const drainIdx = pipeline.indexOf('drainPendingSyncQueueForManualSync');
  if (enqueueIdx < 0) {
    issues.push('runFieldSyncPipeline must call enqueueFarmerCloudSyncActions');
  }
  if (drainIdx < 0) {
    issues.push('runFieldSyncPipeline must call drainPendingSyncQueueForManualSync');
  }
  if (enqueueIdx >= 0 && drainIdx >= 0 && enqueueIdx < drainIdx) {
    issues.push('enqueueFarmerCloudSyncActions must run after queue drain (not before)');
  }

  const priorityTest = path.join(root, 'features/sync/pendingSyncQueuePriority.test.ts');
  if (!fs.existsSync(priorityTest)) {
    issues.push('missing pendingSyncQueuePriority.test.ts');
  }

  if (!fs.existsSync(smokePath)) {
    issues.push('missing DEVICE_SMOKE_CHECKLIST.md');
  } else {
    const smoke = fs.readFileSync(smokePath, 'utf8');
    for (const phrase of [
      'upload before declaration',
      'audit_sync rate limit',
      'land title',
    ]) {
      if (!smoke.toLowerCase().includes(phrase.toLowerCase())) {
        issues.push(`DEVICE_SMOKE_CHECKLIST.md missing sync drain phrase: ${phrase}`);
      }
    }
  }

  if (issues.length === 0) {
    console.log('pending-sync-drain-order-guard: OK');
    process.exit(0);
  }

  console.error('pending-sync-drain-order-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();

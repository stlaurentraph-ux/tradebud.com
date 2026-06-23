#!/usr/bin/env node
/**
 * Pending sync action types in SQLite must match farmerArtifactRegistry upload list
 * and processPendingSyncQueue handlers.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryTs = path.join(root, 'features/sync/farmerArtifactRegistry.ts');
const persistenceNative = path.join(root, 'features/state/persistence.native.ts');
const queueTs = path.join(root, 'features/sync/processPendingSyncQueue.ts');

function extractTsArray(source, exportName) {
  const match = source.match(new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractPersistenceActionTypes(source) {
  const match = source.match(/actionType:\s*\n((?:\s*\|[^\n]+\n)+)/);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function main() {
  const issues = [];
  const registry = extractTsArray(fs.readFileSync(registryTs, 'utf8'), 'PENDING_SYNC_UPLOAD_ACTION_TYPES');
  const persistence = extractPersistenceActionTypes(fs.readFileSync(persistenceNative, 'utf8'));
  const queueSource = fs.readFileSync(queueTs, 'utf8');
  const auditBatchSource = fs.readFileSync(
    path.join(root, 'features/sync/processAuditSyncActionsBatch.ts'),
    'utf8',
  );

  for (const action of registry) {
    if (!persistence.includes(action)) {
      issues.push(`persistence.native.ts missing actionType: ${action}`);
    }
    const handlerInQueue = queueSource.includes(`a.actionType === '${action}'`);
    const handlerInAuditBatch =
      action === 'audit_sync' &&
      auditBatchSource.includes('processAuditSyncActionsBatch') &&
      queueSource.includes('processAuditSyncActionsBatch');
    if (!handlerInQueue && !handlerInAuditBatch) {
      issues.push(`processPendingSyncQueue.ts missing handler for: ${action}`);
    }
  }

  const uploadOnly = new Set(registry);
  for (const action of persistence) {
    if (action.startsWith('consent_')) continue;
    if (!uploadOnly.has(action)) {
      issues.push(`persistence actionType ${action} not listed in farmerArtifactRegistry upload list`);
    }
  }

  if (issues.length === 0) {
    console.log('pending-sync-registry-guard: OK');
    process.exit(0);
  }

  console.error('pending-sync-registry-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();

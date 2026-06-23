#!/usr/bin/env node
/**
 * Ensures farmer-artifact-sync-registry.md stays aligned with farmerArtifactRegistry.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryTs = path.join(root, 'features/sync/farmerArtifactRegistry.ts');
const registryMd = path.join(root, '../../product-os/04-quality/farmer-artifact-sync-registry.md');

function extractTsArray(source, exportName) {
  const match = source.match(new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function main() {
  const issues = [];
  if (!fs.existsSync(registryTs)) {
    console.error('registry-md-parity-guard: missing farmerArtifactRegistry.ts');
    process.exit(1);
  }
  if (!fs.existsSync(registryMd)) {
    console.error('registry-md-parity-guard: missing farmer-artifact-sync-registry.md');
    process.exit(1);
  }

  const ts = fs.readFileSync(registryTs, 'utf8');
  const md = fs.readFileSync(registryMd, 'utf8');

  const auditEvents = extractTsArray(ts, 'FIELD_CLOUD_AUDIT_EVENT_TYPES');
  const restoreModules = extractTsArray(ts, 'FARMER_ARTIFACT_RESTORE_MODULES');
  const uploadActions = extractTsArray(ts, 'PENDING_SYNC_UPLOAD_ACTION_TYPES');

  for (const event of auditEvents) {
    if (!md.includes(event)) {
      issues.push(`markdown registry missing audit event: ${event}`);
    }
  }

  for (const mod of restoreModules) {
    if (!md.includes(mod)) {
      issues.push(`markdown registry missing restore module: ${mod}`);
    }
  }

  for (const action of uploadActions) {
    if (!md.includes(action)) {
      issues.push(`markdown registry missing upload action: ${action}`);
    }
  }

  const requiredSections = [
    'restoreFarmerCloudState',
    'sync-parity-guard.mjs',
    'field_device_preferences_updated',
    'plot_mapping_draft_saved',
  ];
  for (const section of requiredSections) {
    if (!md.includes(section)) {
      issues.push(`markdown registry missing section/reference: ${section}`);
    }
  }

  if (issues.length === 0) {
    console.log('registry-md-parity-guard: OK');
    process.exit(0);
  }

  console.error('registry-md-parity-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();

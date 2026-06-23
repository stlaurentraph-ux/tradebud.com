#!/usr/bin/env node
/**
 * Ensures state transition registry matches sync pipeline and orchestrator wiring.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function extractArray(source, exportName) {
  const match = source.match(new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractSyncQueuePhases(mutexSource) {
  const match = mutexSource.match(/export type SyncQueuePhase =\s*\n([\s\S]*?);/);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function main() {
  const issues = [];
  const registry = read('features/sync/fieldStateTransitionRegistry.ts');
  const mutex = read('features/sync/syncQueueMutex.ts');
  const pipeline = read('features/sync/runFieldSyncPipeline.ts');
  const orchestrator = read('features/sync/restoreFarmerCloudState.ts');
  const checklist = read('features/compliance/plotChecklist.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/field-state-transition-registry.md');
  const md = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : '';

  const registryPhases = extractArray(registry, 'SYNC_QUEUE_PHASES');
  const mutexPhases = extractSyncQueuePhases(mutex);
  const restoreStages = extractArray(registry, 'RESTORE_PIPELINE_STAGES');

  for (const phase of mutexPhases) {
    if (!registryPhases.includes(phase)) {
      issues.push(`fieldStateTransitionRegistry missing SyncQueuePhase: ${phase}`);
    }
  }

  const requiredPipelinePhases = [
    'restoring_plots',
    'uploading_plots',
    'processing_consent',
    'processing_queue',
  ];
  for (const phase of requiredPipelinePhases) {
    if (!pipeline.includes(`'${phase}'`)) {
      issues.push(`runFieldSyncPipeline must set phase: ${phase}`);
    }
  }

  const stageModules = {
    declarations: 'restoreLocalDeclarationsFromServer',
    ground_truth_photos: 'restoreLocalPlotPhotosFromServerAudit',
    evidence: 'restoreLocalEvidenceFromServer',
    device_preferences: 'restoreLocalFieldDevicePreferencesFromServer',
    profile_photo: 'restoreLocalFarmerProfilePhotoFromServer',
    mapping_draft: 'restorePlotMappingDraftFromServer',
    offline_tiles: 'restoreMissingOfflineTilePacksFromServer',
  };

  for (const stage of restoreStages) {
    const mod = stageModules[stage];
    if (!mod) continue;
    if (stage === 'offline_tiles') {
      const prefs = read('features/sync/syncFieldDevicePreferences.ts');
      if (!prefs.includes(mod)) {
        issues.push(`syncFieldDevicePreferences must wire stage ${stage} (${mod})`);
      }
      if (md && !md.includes(stage)) {
        issues.push(`field-state-transition-registry.md missing stage: ${stage}`);
      }
      continue;
    }
    if (!orchestrator.includes(mod)) {
      issues.push(`restoreFarmerCloudState missing stage ${stage} (${mod})`);
    }
    if (md && !md.includes(stage)) {
      issues.push(`field-state-transition-registry.md missing stage: ${stage}`);
    }
  }

  if (!checklist.includes('groundOk')) {
    issues.push('plotChecklist.ts must define groundOk readiness gate');
  }

  if (issues.length === 0) {
    console.log('state-transition-guard: OK');
    process.exit(0);
  }

  console.error('state-transition-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();

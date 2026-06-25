#!/usr/bin/env node
/**
 * P5: push_only must not invoke cloud restore pipeline (regression guard + unit test).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testPath = path.join(root, 'features/sync/runFieldSyncPipeline.test.ts');

function main() {
  const issues = [];
  if (!fs.existsSync(testPath)) {
    issues.push('missing runFieldSyncPipeline.test.ts');
  } else {
    const source = fs.readFileSync(testPath, 'utf8');
    if (!source.includes("syncMode: 'push_only'")) {
      issues.push('runFieldSyncPipeline.test.ts must cover push_only syncMode');
    }
    if (!source.includes('restoreLocalPlotsFromServer).not.toHaveBeenCalled()')) {
      issues.push(
        'runFieldSyncPipeline.test.ts must assert restoreLocalPlotsFromServer is skipped for push_only',
      );
    }
    if (!source.includes('restoreFarmerCloudState).not.toHaveBeenCalled()')) {
      issues.push(
        'runFieldSyncPipeline.test.ts must assert restoreFarmerCloudState is skipped for push_only',
      );
    }
  }

  const telemetryPath = path.join(root, 'features/sync/syncRunHttpTelemetry.ts');
  if (!fs.existsSync(telemetryPath)) {
    issues.push('missing syncRunHttpTelemetry.ts for dev request counting');
  }

  const pipeline = fs.readFileSync(path.join(root, 'features/sync/runFieldSyncPipeline.ts'), 'utf8');
  if (!pipeline.includes("syncMode === 'full'")) {
    issues.push('runFieldSyncPipeline must branch restore on syncMode full');
  }
  if (!pipeline.includes('includeAuditPhotos: false')) {
    issues.push('push_only linked media restore must skip audit_log photo fan-out');
  }

  const evidenceRestore = fs.readFileSync(
    path.join(root, 'features/sync/restoreLocalEvidenceFromServer.ts'),
    'utf8',
  );
  if (evidenceRestore.includes('for (const row of backendPlots)')) {
    issues.push(
      'restoreLocalEvidenceFromServer must not fan out to every server plot — linked local plots only',
    );
  }

  const settingsPath = path.join(root, 'app/(tabs)/settings.tsx');
  const settings = fs.readFileSync(settingsPath, 'utf8');
  if (!settings.includes("syncMode === 'push_only'")) {
    issues.push('settings.tsx must skip heavy post-sync work when syncMode is push_only');
  }
  if (!settings.includes('forcePlotFetch: syncMode !== \'push_only\'')) {
    issues.push('settings.tsx must avoid forcePlotFetch after push_only sync');
  }

  if (issues.length === 0) {
    console.log('push-only-restore-guard: OK');
    process.exit(0);
  }

  console.error('push-only-restore-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();

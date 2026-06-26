#!/usr/bin/env node
/**
 * Field-sync-delta flaky-network soak wiring — Maestro flow, seed profile, checklist phrases.
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

  const smokePath = path.join(root, 'DEVICE_SMOKE_CHECKLIST.md');
  if (!fs.existsSync(smokePath)) {
    issues.push('missing DEVICE_SMOKE_CHECKLIST.md');
  } else {
    const smoke = fs.readFileSync(smokePath, 'utf8');
    const requiredPhrases = [
      'field-sync-delta',
      'upload queue only (skipped cloud restore)',
      'airplane mode mid-sync',
      'incremental restore',
      'field-sync-delta-smoke.yaml',
    ];
    for (const phrase of requiredPhrases) {
      if (!smoke.toLowerCase().includes(phrase.toLowerCase())) {
        issues.push(`DEVICE_SMOKE_CHECKLIST.md missing delta soak phrase: ${phrase}`);
      }
    }
  }

  const flowPath = path.join(root, '.maestro/flows/field-sync-delta-smoke.yaml');
  if (!fs.existsSync(flowPath)) {
    issues.push('missing .maestro/flows/field-sync-delta-smoke.yaml');
  } else {
    const flow = fs.readFileSync(flowPath, 'utf8');
    for (const needle of ['settings-sync-now', 'settings-backup-tech-toggle', 'delta_sync_idle']) {
      if (!flow.includes(needle)) {
        issues.push(`field-sync-delta-smoke.yaml must reference ${needle}`);
      }
    }
  }

  const seed = read('scripts/seed-maestro-simulator.mjs');
  if (!seed.includes('delta_sync_idle') || !seed.includes('field_sync_cursor_v1')) {
    issues.push('seed-maestro-simulator.mjs must support delta_sync_idle with field_sync_cursor_v1');
  }

  const settings = read('app/(tabs)/settings.tsx');
  for (const needle of ['settings-backup-tech-toggle', 'settings-sync-mode-caption']) {
    if (!settings.includes(needle)) {
      issues.push(`settings.tsx must define testID ${needle}`);
    }
  }

  const baseline = JSON.parse(read('qa/automation-baselines/maestro-flows.json'));
  if (!baseline.flows.includes('field-sync-delta-smoke.yaml')) {
    issues.push('maestro-flows.json must list field-sync-delta-smoke.yaml');
  }

  if (issues.length === 0) {
    console.log('field-sync-delta-smoke-guard: OK');
    process.exit(0);
  }

  console.error('field-sync-delta-smoke-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();

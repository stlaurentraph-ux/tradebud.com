#!/usr/bin/env node
/**
 * Field auth + offline backup invariants (sign-out UX, persisted plot links, auto-backup gating).
 * Run: npm run qa:field-readiness:assert
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function assertIncludes(rel, needle, label) {
  const text = read(rel);
  if (!text.includes(needle)) {
    console.error(`FAIL: ${label} — expected "${needle}" in ${rel}`);
    process.exit(1);
  }
  console.log(`OK: ${label}`);
}

function assertFile(rel, label) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`FAIL: missing ${rel} (${label})`);
    process.exit(1);
  }
  console.log(`OK file: ${label}`);
}

console.log('Field auth + backup guard\n');

assertFile('.maestro/flows/signed-out-backup-status-smoke.yaml', 'signed-out backup Maestro flow');
assertFile('features/sync/hasLocalSyncWork.test.ts', 'local sync work integration tests');
assertFile('features/sync/homeBackupAttention.test.ts', 'home backup attention tests');
assertFile('PREVIEW_FIELD_READINESS.md', 'preview field readiness doc');

assertIncludes(
  'features/plots/plotServerLink.ts',
  'if (persisted && backendRows.length === 0)',
  'confirmed server plot id trusts persisted link offline',
);
assertIncludes(
  'features/sync/hasLocalSyncWork.ts',
  'trustPersistedLinksWithoutServer: true',
  'local sync work trusts persisted plot links',
);
assertIncludes('features/sync/runAutoBackup.ts', 'hasSyncAuthSession()', 'auto backup requires session');
assertIncludes('features/sync/plotServerSync.ts', 'stoppedForAuth: true', 'plot upload stops without session');
assertIncludes('app/(tabs)/index.tsx', 'plotsBackedUpOnDevice', 'home backup card uses device link memory');
assertIncludes('app/(tabs)/index.tsx', 'testID="home-backup-status-caption"', 'home backup caption testID');
assertIncludes('app/(tabs)/settings.tsx', 'testID="settings-sign-out-device"', 'settings sign-out testID');
assertIncludes(
  'scripts/seed-maestro-simulator.mjs',
  'backed_up_offline',
  'Maestro seed profile for signed-out backed-up plots',
);
assertIncludes(
  '.maestro/flows/signed-out-backup-status-smoke.yaml',
  'home-backup-status-caption',
  'Maestro asserts home backup caption testID',
);
assertIncludes('DEVICE_SMOKE_CHECKLIST.md', 'signed-out-backup-status-smoke.yaml', 'device smoke Maestro sign-out backup');
assertIncludes('PREVIEW_FIELD_READINESS.md', 'Preview build vs field-ready', 'preview readiness disclaimer');

console.log('\nRunning unit tests (hasLocalSyncWork + homeBackupAttention)…');
const test = spawnSync(
  process.execPath,
  [
    path.join(root, 'node_modules/vitest/vitest.mjs'),
    'run',
    'features/sync/hasLocalSyncWork.test.ts',
    'features/sync/homeBackupAttention.test.ts',
    'features/sync/plotSyncPending.test.ts',
    'features/plots/plotServerLink.test.ts',
  ],
  { cwd: root, stdio: 'inherit' },
);
if (test.status !== 0) {
  console.error('\nfield-auth-backup-guard: unit tests failed.');
  process.exit(1);
}

console.log('\nfield-auth-backup-guard: OK');

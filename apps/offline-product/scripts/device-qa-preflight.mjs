#!/usr/bin/env node
/**
 * Automated gates before manual device QA (launch checklist slice).
 * Static wiring assertions for harvest queue, plot id sync, Sentry bridge, sync mutex.
 */
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
    console.error(`FAIL wiring: ${label} — expected "${needle}" in ${rel}`);
    process.exit(1);
  }
  console.log(`OK wiring: ${label}`);
}

function assertNotIncludes(rel, needle, label) {
  const text = read(rel);
  if (text.includes(needle)) {
    console.error(`FAIL wiring: ${label} — must not include "${needle}" in ${rel}`);
    process.exit(1);
  }
  console.log(`OK wiring: ${label}`);
}

function assertFile(rel, label) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`FAIL missing file: ${rel} (${label})`);
    process.exit(1);
  }
  console.log(`OK file: ${label}`);
}

console.log('Device QA preflight — static wiring\n');

assertFile('features/harvest/submitHarvest.ts', 'harvest submit helper');
assertFile('features/plots/clientPlotId.ts', 'stable client plot id');
assertFile('features/sync/syncQueueMutex.ts', 'sync queue mutex');

assertIncludes('app/(tabs)/harvests.tsx', 'submitHarvestRecord', 'Harvests uses submitHarvestRecord');
assertIncludes('features/errors/ErrorLogger.ts', 'reportErrorToSentry', 'logError → Sentry bridge');
assertIncludes('features/mapping/WalkPerimeterScreen.tsx', 'resolveClientPlotId', 'walk upload uses client plot id');
assertIncludes('features/sync/plotServerSync.ts', 'resolveClientPlotId', 'plot sync uses client plot id');
assertIncludes('components/AutoPlotUploadBridge.tsx', 'runConservativeAutoBackup', 'auto upload bridge uses conservative backup');
assertIncludes('features/sync/runAutoBackup.ts', 'runFieldSyncPipeline', 'auto backup uses field sync pipeline');
assertIncludes('app/(tabs)/settings.tsx', 'withSyncQueueLock', 'Settings sync uses queue mutex');
assertIncludes('features/sync/runAutoBackup.ts', 'withSyncQueueLock', 'auto backup uses queue mutex');
assertIncludes('features/sync/runAutoBackup.ts', 'withSyncOperationTimeout', 'auto backup operation timeout');
assertIncludes('features/sync/runAutoBackup.ts', 'SYNC_BACKGROUND_OPERATION_MS', 'auto backup timeout budget');
assertIncludes('app/(tabs)/settings.tsx', 'withSyncOperationTimeout', 'manual sync operation timeout');
assertIncludes('app/(tabs)/settings.tsx', 'SYNC_MANUAL_OPERATION_MS', 'manual sync timeout budget');
assertIncludes('app/(tabs)/settings.tsx', 'SYNC_LOCK_WAIT_MS', 'manual sync lock wait budget');
assertIncludes('app/(tabs)/settings.tsx', 'syncTimedOutMessage', 'manual sync timeout message');
assertIncludes('features/i18n/messages/en.json', 'sync_progress_stopping_soon', 'sync stopping soon copy');
assertIncludes('features/sync/processPendingSyncQueue.ts', 'computeBackoffMs', 'sync queue exponential backoff');
assertIncludes('features/state/persistence.native.ts', 'MAX_PENDING_SYNC_ACTIONS', 'native queue cap');
assertIncludes('features/i18n/messages/en.json', 'harvest_queued_offline', 'harvest queued i18n');
assertIncludes('features/i18n/messages/en.json', 'perm_location_title', 'location permission i18n');
assertIncludes('features/permissions/locationPermission.ts', 'openSettings', 'location denied → settings');
assertIncludes('scripts/release-preflight.mjs', 'EXPO_PUBLIC_TRACEBUD_TEST_EMAIL', 'production forbids test creds');
assertIncludes('scripts/release-preflight.mjs', '--verify-oauth', 'oauth verify flag');
assertIncludes('features/i18n/messages/en.json', 'perm_push_title', 'push permission i18n');
assertIncludes('app/(tabs)/settings.tsx', 'alertOnDeny: true', 'settings push enable with deny alert');
assertIncludes('app/(tabs)/settings.tsx', 'settings_notifications_title', 'settings notifications UI');
assertIncludes('DEVICE_SMOKE_CHECKLIST.md', '## 4. OAuth sign-in', 'device smoke oauth section');
assertIncludes('DEVICE_SMOKE_CHECKLIST.md', 'Enable notifications', 'device smoke push steps');
assertIncludes('DEVICE_SMOKE_CHECKLIST.md', '## 10. Tenant & session', 'device smoke tenant section');
assertIncludes('DEVICE_SMOKE_CHECKLIST.md', 'INCIDENT_RUNBOOK.md', 'device smoke incident link');
assertIncludes('STORE_OPS_CHECKLIST.md', 'App Privacy', 'store ops privacy section');
assertIncludes('scripts/store-ops-preflight.mjs', 'NSUserNotificationsUsageDescription', 'store preflight push string');
assertIncludes('features/api/postPlot.ts', "from './syncAuthSession'", 'postPlot unified auth');
assertIncludes('scripts/security-preflight.mjs', 'sanitizeLogContext', 'security preflight script');

// Home screen 2×2 tiles — layout + copy contract (dev + prod)
assertIncludes('app/(tabs)/index.tsx', 'HOME_TILE_PAD_MIN = 16', 'home tiles min padding');
assertIncludes('app/(tabs)/index.tsx', 'flex: 1,\n    alignSelf: \'stretch\'', 'home tiles flex row height');
assertIncludes('app/(tabs)/index.tsx', 'testID={`home-tile-${tile.key.replace(/_/g, \'-\')}`}', 'home tile test ids');
assertNotIncludes('app/(tabs)/index.tsx', 'numberOfLines', 'home tiles wrap text (no numberOfLines)');

const en = JSON.parse(read('features/i18n/messages/en.json'));
const homeTileTitleKeys = [
  'register_plot_tile',
  'log_harvest_tile',
  'documents_tile',
  'my_vouchers_tile',
];
const homeTileTitles = {
  register_plot_tile: 'Mapping',
  log_harvest_tile: 'Deliveries',
  documents_tile: 'Documents',
  my_vouchers_tile: 'Vouchers',
};
for (const [key, expected] of Object.entries(homeTileTitles)) {
  if (en[key] !== expected) {
    console.error(`FAIL home tile title: ${key} expected "${expected}", got "${en[key]}"`);
    process.exit(1);
  }
}
console.log('OK home tiles: canonical EN titles');

const localeDir = 'features/i18n/messages';
const localeFiles = fs
  .readdirSync(localeDir)
  .filter((f) => f.endsWith('.json') && f !== 'en.json');
const HOME_TILE_TITLE_MAX_LEN = 22;
for (const file of localeFiles) {
  const locale = JSON.parse(read(`${localeDir}/${file}`));
  for (const key of homeTileTitleKeys) {
    const value = locale[key];
    if (typeof value !== 'string' || !value.trim()) {
      console.error(`FAIL ${file}: missing home tile key ${key}`);
      process.exit(1);
    }
    if (value.length > HOME_TILE_TITLE_MAX_LEN) {
      console.error(
        `FAIL ${file}: ${key} too long (${value.length} > ${HOME_TILE_TITLE_MAX_LEN}): "${value}"`,
      );
      process.exit(1);
    }
  }
}
console.log(`OK home tiles: short titles in ${localeFiles.length} locales`);

const enForPlaceholders = en;
const placeholderKeys = Object.entries(enForPlaceholders).filter(([k, v]) => k === v).map(([k]) => k);
if (placeholderKeys.length > 0) {
  console.error(`FAIL en.json placeholder keys (${placeholderKeys.length}): ${placeholderKeys.slice(0, 5).join(', ')}…`);
  process.exit(1);
}
console.log('OK en.json: no placeholder keys');

assertFile('features/sync/runFieldSyncPipeline.ts', 'unified field sync pipeline');
assertFile('features/sync/reportSyncFailure.ts', 'sync failure Sentry breadcrumbs');
assertFile('features/sync/syncFailureFromEvidenceUpload.ts', 'storage vs API failure mapping');
assertIncludes('app/(tabs)/settings.tsx', 'runFieldSyncPipeline', 'Settings Sync now uses pipeline');
assertIncludes('app/(tabs)/settings.tsx', 'testID="settings-sync-now"', 'Settings sync Maestro testID');
assertIncludes('features/sync/processPendingSyncQueue.ts', 'reportSyncFailure', 'queue drain reports failures');
assertIncludes('features/evidence/syncGroundTruthPhotosWithFiles.ts', 'syncFailureFromEvidenceUpload', 'photo storage typed failures');
assertFile('.maestro/flows/settings-sync-smoke.yaml', 'settings sync Maestro smoke');

console.log('\nStatic wiring OK. Run `npm run qa:full` before `release:production:safe`.');

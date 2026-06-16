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
assertIncludes('components/AutoPlotUploadBridge.tsx', 'runAutoBackup', 'auto upload bridge drains queue');
assertIncludes('features/sync/runAutoBackup.ts', 'processPendingSyncQueue', 'auto backup drains queue');
assertIncludes('app/(tabs)/settings.tsx', 'withSyncQueueLock', 'Settings sync uses queue mutex');
assertIncludes('features/sync/runAutoBackup.ts', 'withSyncQueueLock', 'auto backup uses queue mutex');
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

const en = JSON.parse(read('features/i18n/messages/en.json'));
const placeholderKeys = Object.entries(en).filter(([k, v]) => k === v).map(([k]) => k);
if (placeholderKeys.length > 0) {
  console.error(`FAIL en.json placeholder keys (${placeholderKeys.length}): ${placeholderKeys.slice(0, 5).join(', ')}…`);
  process.exit(1);
}
console.log('OK en.json: no placeholder keys');

console.log('\nStatic wiring OK. Run `npm run qa:full` before `release:production:safe`.');

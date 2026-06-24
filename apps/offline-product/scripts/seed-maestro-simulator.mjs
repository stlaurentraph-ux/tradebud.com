#!/usr/bin/env node
/**
 * Seeds the booted iOS simulator Tracebud SQLite DB for Maestro flows.
 * Usage: node scripts/seed-maestro-simulator.mjs
 *
 * Profiles (MAESTRO_SEED_PROFILE):
 *   default — farmer + plot (full local seed)
 *   cross_device_b — plot + server link, no local media (Device B restore UX)
 *   backed_up_offline — plot + server link, signed-out backup status smoke
 *   delta_sync_idle — plot + server link + field_sync_cursor_v1 (delta skip soak seed)
 *
 * Requires Tracebud installed and booted once (creates tracebud_offline.db).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const MAESTRO_SEED_FARMER_NAME = 'Maria Santos';
export const MAESTRO_SEED_PLOT_NAME = 'Finca Norte';

const FARMER_ID = 'a0000000-0000-4000-8000-000000000001';
const PLOT_ID = 'a0000000-0000-4000-8000-000000000011';
const SERVER_PLOT_ID = 'a0000000-0000-4000-8000-000000000099';
const NOW = Date.now();
const DB_WAIT_MS = Number(process.env.MAESTRO_SEED_DB_WAIT_MS ?? 45_000);
const DB_POLL_MS = 500;

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function sleep(ms) {
  execSync(`sleep ${Math.ceil(ms / 1000)}`);
}

function findBootedDeviceId() {
  const deviceId = process.env.MAESTRO_DEVICE_ID?.trim();
  if (deviceId) return deviceId;

  const out = sh('xcrun simctl list devices booted');
  const match = out.match(/\(([0-9A-F-]{36})\) \(Booted\)/i);
  if (!match) throw new Error('No booted iOS simulator. Open Simulator first.');
  return match[1];
}

function findTracebudDb(deviceId) {
  const root = path.join(
    process.env.HOME,
    'Library/Developer/CoreSimulator/Devices',
    deviceId,
    'data/Containers/Data/Application',
  );
  if (!fs.existsSync(root)) return null;

  for (const appId of fs.readdirSync(root)) {
    const dbPath = path.join(root, appId, 'Documents/SQLite/tracebud_offline.db');
    if (fs.existsSync(dbPath)) return dbPath;
  }
  return null;
}

function waitForTracebudDb(deviceId) {
  const started = Date.now();
  while (Date.now() - started < DB_WAIT_MS) {
    const dbPath = findTracebudDb(deviceId);
    if (dbPath) return dbPath;
    sleep(DB_POLL_MS);
  }
  throw new Error(
    'tracebud_offline.db not found. Install Tracebud, launch once on the simulator, then retry.',
  );
}

function sql(dbPath, statement) {
  const oneLine = statement.replace(/\s+/g, ' ').trim();
  sh(`sqlite3 ${JSON.stringify(dbPath)} ${JSON.stringify(oneLine)}`);
}

function seedBackedUpOfflineProfile(dbPath) {
  sql(
    dbPath,
    `INSERT OR REPLACE INTO plot_legal (plotId, serverPlotId) VALUES ('${PLOT_ID}', '${SERVER_PLOT_ID}')`,
  );
  sql(
    dbPath,
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('tracebud.syncAuth.signedOut', '1')`,
  );
  sql(
    dbPath,
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('maestroSeedProfile', 'backed_up_offline')`,
  );
}

function seedCrossDeviceBProfile(dbPath) {
  sql(dbPath, 'DELETE FROM plot_photos;');
  sql(dbPath, 'DELETE FROM plot_title_photos;');
  sql(dbPath, 'DELETE FROM plot_evidence;');
  sql(
    dbPath,
    `INSERT OR REPLACE INTO plot_legal (plotId, serverPlotId) VALUES ('${PLOT_ID}', '${SERVER_PLOT_ID}')`,
  );
  sql(
    dbPath,
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('maestroSeedProfile', 'cross_device_b')`,
  );
}

function seedDeltaSyncIdleProfile(dbPath) {
  seedCrossDeviceBProfile(dbPath);
  const cursorJson = JSON.stringify({
    cursorMs: NOW,
    auditByFarmer: { [FARMER_ID]: new Date(NOW).toISOString() },
    voucherFingerprint: '',
  }).replace(/'/g, "''");
  sql(
    dbPath,
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('field_sync_cursor_v1', '${cursorJson}')`,
  );
  sql(
    dbPath,
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('maestroSeedProfile', 'delta_sync_idle')`,
  );
}

function main() {
  const profile = (process.env.MAESTRO_SEED_PROFILE ?? 'default').trim();
  const deviceId = findBootedDeviceId();
  const dbPath = waitForTracebudDb(deviceId);
  const pointsJson = JSON.stringify([
    { latitude: 14.0818, longitude: -87.2068 },
    { latitude: 14.0828, longitude: -87.2068 },
    { latitude: 14.0828, longitude: -87.2058 },
    { latitude: 14.0818, longitude: -87.2058 },
  ]);

  sql(dbPath, 'PRAGMA journal_mode = WAL;');
  sql(
    dbPath,
    `INSERT OR REPLACE INTO farmer (id, name, role, selfDeclared, selfDeclaredAt, fpicConsent, laborNoChildLabor, laborNoForcedLabor) VALUES ('${FARMER_ID}', '${MAESTRO_SEED_FARMER_NAME}', 'farmer', 1, ${NOW}, 1, 1, 1)`,
  );
  sql(
    dbPath,
    `INSERT OR REPLACE INTO plots (id, farmerId, name, createdAt, areaSquareMeters, areaHectares, kind, pointsJson) VALUES ('${PLOT_ID}', '${FARMER_ID}', '${MAESTRO_SEED_PLOT_NAME}', ${NOW}, 10000, 1.0, 'polygon', '${pointsJson.replace(/'/g, "''")}')`,
  );
  sql(dbPath, `INSERT OR REPLACE INTO settings (key, value) VALUES ('tracebudAppLanguage', 'en')`);

  if (profile === 'cross_device_b') {
    seedCrossDeviceBProfile(dbPath);
  } else if (profile === 'backed_up_offline') {
    seedBackedUpOfflineProfile(dbPath);
  } else if (profile === 'delta_sync_idle') {
    seedDeltaSyncIdleProfile(dbPath);
  } else {
    sql(dbPath, `DELETE FROM settings WHERE key = 'maestroSeedProfile'`);
  }

  const plots = sql(dbPath, 'SELECT COUNT(*) FROM plots;');
  const farmer = sql(dbPath, 'SELECT name FROM farmer LIMIT 1;');
  console.log(`Seeded ${dbPath} (profile=${profile})`);
  console.log(`  farmer: ${farmer}`);
  console.log(`  plots: ${plots}`);
}

main();

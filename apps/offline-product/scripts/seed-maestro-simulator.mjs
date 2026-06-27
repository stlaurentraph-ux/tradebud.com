#!/usr/bin/env node
/**
 * Seeds the booted iOS simulator Tracebud SQLite DB for Maestro flows.
 * Usage: node scripts/seed-maestro-simulator.mjs
 *
 * Profiles (MAESTRO_SEED_PROFILE):
 *   default — farmer + plot (full local seed)
 *   cross_device_b — plot + server link, no local media (Device B restore UX)
 *
 * Requires Tracebud installed and booted once (creates tracebud_offline.db).
 */
import {
  findBootedIosDeviceId,
  sh,
  waitForIosTracebudDb,
} from './maestro-ios-db-path.mjs';

export const MAESTRO_SEED_FARMER_NAME = 'Maria Santos';
export const MAESTRO_SEED_PLOT_NAME = 'Finca Norte';

const FARMER_ID = 'a0000000-0000-4000-8000-000000000001';
const PLOT_ID = 'a0000000-0000-4000-8000-000000000011';
const SERVER_PLOT_ID = 'a0000000-0000-4000-8000-000000000099';
const NOW = Date.now();

function sql(dbPath, statement) {
  const oneLine = statement.replace(/\s+/g, ' ').trim();
  sh(`sqlite3 ${JSON.stringify(dbPath)} ${JSON.stringify(oneLine)}`);
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

function main() {
  const profile = (process.env.MAESTRO_SEED_PROFILE ?? 'default').trim();
  const deviceId = findBootedIosDeviceId();
  const dbPath = waitForIosTracebudDb(deviceId);
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

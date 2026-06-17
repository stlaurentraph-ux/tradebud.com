#!/usr/bin/env node
/**
 * Seeds the booted iOS simulator Tracebud SQLite DB for Maestro flows.
 * Usage: node scripts/seed-maestro-simulator.mjs
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FARMER_ID = 'a0000000-0000-4000-8000-000000000001';
const PLOT_ID = 'a0000000-0000-4000-8000-000000000011';
const NOW = Date.now();

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function findBootedDeviceId() {
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
  for (const appId of fs.readdirSync(root)) {
    const dbPath = path.join(root, appId, 'Documents/SQLite/tracebud_offline.db');
    if (fs.existsSync(dbPath)) return dbPath;
  }
  throw new Error('tracebud_offline.db not found. Install and open Tracebud on the simulator once.');
}

function sql(dbPath, statement) {
  const oneLine = statement.replace(/\s+/g, ' ').trim();
  sh(`sqlite3 ${JSON.stringify(dbPath)} ${JSON.stringify(oneLine)}`);
}

function main() {
  const deviceId = findBootedDeviceId();
  const dbPath = findTracebudDb(deviceId);
  const pointsJson = JSON.stringify([
    { latitude: 14.0818, longitude: -87.2068 },
    { latitude: 14.0828, longitude: -87.2068 },
    { latitude: 14.0828, longitude: -87.2058 },
    { latitude: 14.0818, longitude: -87.2058 },
  ]);

  sql(dbPath, 'PRAGMA journal_mode = WAL;');
  sql(
    dbPath,
    `INSERT OR REPLACE INTO farmer (id, name, role, selfDeclared, selfDeclaredAt, fpicConsent, laborNoChildLabor, laborNoForcedLabor) VALUES ('${FARMER_ID}', 'Maria Santos', 'farmer', 1, ${NOW}, 1, 1, 1)`,
  );
  sql(
    dbPath,
    `INSERT OR REPLACE INTO plots (id, farmerId, name, createdAt, areaSquareMeters, areaHectares, kind, pointsJson) VALUES ('${PLOT_ID}', '${FARMER_ID}', 'Finca Norte', ${NOW}, 10000, 1.0, 'polygon', '${pointsJson.replace(/'/g, "''")}')`,
  );
  sql(dbPath, `INSERT OR REPLACE INTO settings (key, value) VALUES ('tracebudAppLanguage', 'en')`);

  const plots = sql(dbPath, 'SELECT COUNT(*) FROM plots;');
  const farmer = sql(dbPath, 'SELECT name FROM farmer LIMIT 1;');
  console.log(`Seeded ${dbPath}`);
  console.log(`  farmer: ${farmer}`);
  console.log(`  plots: ${plots}`);
  console.log('Force-quit Tracebud on the simulator, then re-open before running Maestro.');
}

main();

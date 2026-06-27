#!/usr/bin/env node
/**
 * Minimal Maestro golden-path seed: English locale + welcome modal dismissed.
 * Used when MAESTRO_SEED_SKIP=1 (no farmer/plot seed).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

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
  if (!match) throw new Error('No booted iOS simulator.');
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
  throw new Error('tracebud_offline.db not found after bootstrap launch.');
}

function sql(dbPath, statement) {
  const oneLine = statement.replace(/\s+/g, ' ').trim();
  sh(`sqlite3 ${JSON.stringify(dbPath)} ${JSON.stringify(oneLine)}`);
}

function main() {
  const deviceId = findBootedDeviceId();
  const dbPath = waitForTracebudDb(deviceId);

  sql(dbPath, 'PRAGMA journal_mode = WAL;');
  sql(
    dbPath,
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('tracebudAppLanguage', 'en')`,
  );
  sql(
    dbPath,
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('account_welcome_dismissed', '1')`,
  );

  console.log(`Golden-path minimal seed applied: ${dbPath}`);
}

main();

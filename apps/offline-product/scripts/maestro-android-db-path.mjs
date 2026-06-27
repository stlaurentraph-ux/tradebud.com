#!/usr/bin/env node
/**
 * Locate and patch tracebud_offline.db on Android emulator (adb run-as + host sqlite3).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { sh, sleepMs } from './maestro-ios-db-path.mjs';

const APP_ID = 'com.tracebud.app';

const REL_CANDIDATES = [
  'files/SQLite/tracebud_offline.db',
  'databases/tracebud_offline.db',
];

export function androidSerial() {
  return (
    process.env.MAESTRO_ANDROID_SERIAL?.trim() ||
    process.env.ANDROID_SERIAL?.trim() ||
    sh("adb devices | awk 'NR>1 && $2==\"device\" { print $1; exit }'")
  );
}

function relPathExists(serial, relPath) {
  try {
    const out = sh(
      `adb -s ${JSON.stringify(serial)} shell run-as ${APP_ID} test -f ${relPath} && echo yes`,
    );
    return out.includes('yes');
  } catch {
    return false;
  }
}

export function findAndroidTracebudDb(serial) {
  for (const rel of REL_CANDIDATES) {
    if (relPathExists(serial, rel)) return rel;
  }
  try {
    const found = sh(
      `adb -s ${JSON.stringify(serial)} shell run-as ${APP_ID} sh -c 'find . -name tracebud_offline.db 2>/dev/null | head -1'`,
    )
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.includes('tracebud_offline.db'));
    if (found) return found;
  } catch {
    // keep polling
  }
  return null;
}

export function waitForAndroidTracebudDb(serial, options = {}) {
  const waitMs = Number(options.waitMs ?? process.env.MAESTRO_SEED_DB_WAIT_MS ?? 120_000);
  const pollMs = Number(options.pollMs ?? 500);
  const started = Date.now();
  let attempts = 0;

  while (Date.now() - started < waitMs) {
    attempts += 1;
    const relPath = findAndroidTracebudDb(serial);
    if (relPath) {
      console.log(`Found tracebud_offline.db after ${attempts} attempt(s): ${relPath}`);
      return relPath;
    }
    sleepMs(pollMs);
  }

  throw new Error(
    `tracebud_offline.db not found on Android emulator after ${waitMs}ms (${attempts} attempts).`,
  );
}

function sqlFile(dbPath, statement) {
  const oneLine = statement.replace(/\s+/g, ' ').trim();
  sh(`sqlite3 ${JSON.stringify(dbPath)} ${JSON.stringify(oneLine)}`);
}

function applySettingsOnHost(dbPath, settings) {
  sqlFile(dbPath, 'PRAGMA journal_mode = WAL;');
  for (const [key, value] of Object.entries(settings)) {
    const escaped = String(value).replace(/'/g, "''");
    sqlFile(
      dbPath,
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('${key}', '${escaped}')`,
    );
  }
}

export function applyAndroidBootSettings(serial, relPath, settings) {
  const tmpPath = path.join(os.tmpdir(), `tracebud-maestro-${process.pid}-${Date.now()}.db`);
  sh(
    `adb -s ${JSON.stringify(serial)} exec-out run-as ${APP_ID} cat ${relPath} > ${JSON.stringify(tmpPath)}`,
  );
  applySettingsOnHost(tmpPath, settings);
  sh(
    `adb -s ${JSON.stringify(serial)} push ${JSON.stringify(tmpPath)} /data/local/tmp/tracebud-maestro-seed.db`,
  );
  sh(
    `adb -s ${JSON.stringify(serial)} shell run-as ${APP_ID} cp /data/local/tmp/tracebud-maestro-seed.db ${relPath}`,
  );
  fs.unlinkSync(tmpPath);
}

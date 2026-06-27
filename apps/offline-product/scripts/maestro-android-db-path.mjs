#!/usr/bin/env node
/**
 * Locate and patch tracebud_offline.db on Android emulator (adb root + run-as fallback).
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

export function androidDataRoot() {
  return `/data/data/${APP_ID}`;
}

export function toAndroidDbAbsPath(relOrAbs) {
  if (relOrAbs.startsWith('/')) return relOrAbs;
  return `${androidDataRoot()}/${relOrAbs}`;
}

/** CI emulators allow adb root — avoids flaky run-as sh/find on cold agents. */
export function tryEnableAdbRoot(serial) {
  try {
    const out = sh(`adb -s ${JSON.stringify(serial)} root`);
    return /running as root|restarting adbd as root/i.test(out);
  } catch {
    return false;
  }
}

function shellTestFile(serial, absPath) {
  try {
    const out = sh(
      `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`test -f ${absPath} && echo yes`)}`,
    );
    return out.includes('yes');
  } catch {
    return false;
  }
}

function relPathExistsRunAs(serial, relPath) {
  try {
    const out = sh(
      `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`run-as ${APP_ID} test -f ${relPath} && echo yes`)}`,
    );
    return out.includes('yes');
  } catch {
    return false;
  }
}

function findWithAdbRoot(serial) {
  for (const rel of REL_CANDIDATES) {
    const absPath = toAndroidDbAbsPath(rel);
    if (shellTestFile(serial, absPath)) return absPath;
  }
  try {
    const found = sh(
      `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`find ${androidDataRoot()} -name tracebud_offline.db 2>/dev/null | head -1`)}`,
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

function findWithRunAs(serial) {
  for (const rel of REL_CANDIDATES) {
    if (relPathExistsRunAs(serial, rel)) return rel;
  }
  try {
    const found = sh(
      `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`run-as ${APP_ID} find . -name tracebud_offline.db 2>/dev/null | head -1`)}`,
    )
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.includes('tracebud_offline.db'));
    if (found) return found.startsWith('/') ? found : found;
  } catch {
    // keep polling
  }
  return null;
}

export function findAndroidTracebudDb(serial) {
  tryEnableAdbRoot(serial);
  const rooted = findWithAdbRoot(serial);
  if (rooted) return rooted;
  return findWithRunAs(serial);
}

function androidProcessRunning(serial) {
  try {
    const pid = sh(`adb -s ${JSON.stringify(serial)} shell pidof ${APP_ID}`);
    return Boolean(pid.trim());
  } catch {
    return false;
  }
}

function androidDataDirListing(serial) {
  try {
    return sh(
      `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`ls -la ${androidDataRoot()} 2>/dev/null || echo missing`)}`,
    );
  } catch {
    return '(ls failed)';
  }
}

/** Last-resort: app data dir exists but SQLite never appeared (slow RN boot on CI). */
function provisionMinimalAndroidDb(serial, absPath) {
  const tmpPath = path.join(os.tmpdir(), `tracebud-maestro-provision-${process.pid}-${Date.now()}.db`);
  sh(
    `sqlite3 ${JSON.stringify(tmpPath)} ${JSON.stringify('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);')}`,
  );
  const relPath = absPath.replace(`${androidDataRoot()}/`, '');
  const dirAbs = path.posix.dirname(absPath);

  tryEnableAdbRoot(serial);
  if (shellTestFile(serial, absPath)) return absPath;

  try {
    sh(`adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`mkdir -p ${dirAbs}`)}`);
    sh(
      `adb -s ${JSON.stringify(serial)} push ${JSON.stringify(tmpPath)} /data/local/tmp/tracebud-maestro-provision.db`,
    );
    sh(
      `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`cp /data/local/tmp/tracebud-maestro-provision.db ${absPath}`)}`,
    );
    sh(`adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`chmod 660 ${absPath}`)}`);
    fs.unlinkSync(tmpPath);
    if (shellTestFile(serial, absPath)) {
      console.log(`Provisioned minimal boot DB at ${absPath}`);
      return absPath;
    }
  } catch {
    // fall through to run-as cp
  }

  sh(
    `adb -s ${JSON.stringify(serial)} push ${JSON.stringify(tmpPath)} /data/local/tmp/tracebud-maestro-provision.db`,
  );
  sh(
    `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`run-as ${APP_ID} mkdir -p ${path.posix.dirname(relPath)}`)}`,
  );
  sh(
    `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`run-as ${APP_ID} cp /data/local/tmp/tracebud-maestro-provision.db ${relPath}`)}`,
  );
  fs.unlinkSync(tmpPath);
  if (relPathExistsRunAs(serial, relPath)) {
    console.log(`Provisioned minimal boot DB via run-as at ${relPath}`);
    return relPath;
  }
  return null;
}

export function waitForAndroidTracebudDb(serial, options = {}) {
  const waitMs = Number(options.waitMs ?? process.env.MAESTRO_SEED_DB_WAIT_MS ?? 120_000);
  const pollMs = Number(options.pollMs ?? 500);
  const started = Date.now();
  let attempts = 0;
  const defaultAbs = toAndroidDbAbsPath(REL_CANDIDATES[0]);

  while (Date.now() - started < waitMs) {
    attempts += 1;
    const dbPath = findAndroidTracebudDb(serial);
    if (dbPath) {
      console.log(`Found tracebud_offline.db after ${attempts} attempt(s): ${dbPath}`);
      return dbPath;
    }
    sleepMs(pollMs);
  }

  if (androidProcessRunning(serial)) {
    const provisioned = provisionMinimalAndroidDb(serial, defaultAbs);
    if (provisioned) return provisioned;
  }

  throw new Error(
    `tracebud_offline.db not found on Android emulator after ${waitMs}ms (${attempts} attempts). ` +
      `processRunning=${androidProcessRunning(serial)} dataDir=${androidDataDirListing(serial)}`,
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

function readDbToHost(serial, dbPath, tmpPath) {
  const absPath = toAndroidDbAbsPath(dbPath);
  if (absPath.startsWith('/') && shellTestFile(serial, absPath)) {
    sh(
      `adb -s ${JSON.stringify(serial)} exec-out cat ${JSON.stringify(absPath)} > ${JSON.stringify(tmpPath)}`,
    );
    return;
  }
  const relPath = absPath.replace(`${androidDataRoot()}/`, '');
  sh(
    `adb -s ${JSON.stringify(serial)} exec-out run-as ${APP_ID} cat ${relPath} > ${JSON.stringify(tmpPath)}`,
  );
}

function writeHostDbToDevice(serial, dbPath, tmpPath) {
  const absPath = toAndroidDbAbsPath(dbPath);
  sh(
    `adb -s ${JSON.stringify(serial)} push ${JSON.stringify(tmpPath)} /data/local/tmp/tracebud-maestro-seed.db`,
  );
  if (absPath.startsWith('/') && tryEnableAdbRoot(serial)) {
    sh(
      `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`cp /data/local/tmp/tracebud-maestro-seed.db ${absPath}`)}`,
    );
    return;
  }
  const relPath = absPath.replace(`${androidDataRoot()}/`, '');
  sh(
    `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`run-as ${APP_ID} cp /data/local/tmp/tracebud-maestro-seed.db ${relPath}`)}`,
  );
}

export function applyAndroidBootSettings(serial, dbPath, settings) {
  const tmpPath = path.join(os.tmpdir(), `tracebud-maestro-${process.pid}-${Date.now()}.db`);
  readDbToHost(serial, dbPath, tmpPath);
  applySettingsOnHost(tmpPath, settings);
  writeHostDbToDevice(serial, dbPath, tmpPath);
  fs.unlinkSync(tmpPath);
}

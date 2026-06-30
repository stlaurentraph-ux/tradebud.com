#!/usr/bin/env node
/**
 * Locate and patch tracebud_offline.db on Android emulator (adb root + run-as fallback).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sh, sleepMs } from './maestro-ios-db-path.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOT_SCHEMA_SQL = path.join(__dirname, 'maestro-android-boot-schema.sql');

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

function appDataUid(serial) {
  return sh(
    `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`stat -c '%u' ${androidDataRoot()} 2>/dev/null || stat -f '%u' ${androidDataRoot()}`)}`,
  ).trim();
}

/** Root copies leave DB unreadable by the app — match app data dir uid/gid. */
function fixRootCopiedDbOwnership(serial, absPath) {
  tryEnableAdbRoot(serial);
  const uid = appDataUid(serial);
  if (!uid || !/^\d+$/.test(uid)) return;
  sh(
    `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`chown ${uid}:${uid} ${absPath} && chmod 660 ${absPath}`)}`,
  );
}

function pushDbViaRunAs(serial, relPath, hostDbPath, label) {
  const dirRel = path.posix.dirname(relPath);
  sh(
    `adb -s ${JSON.stringify(serial)} push ${JSON.stringify(hostDbPath)} /data/local/tmp/${label}.db`,
  );
  if (dirRel && dirRel !== '.') {
    sh(
      `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`run-as ${APP_ID} mkdir -p ${dirRel}`)}`,
    );
  }
  sh(
    `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`run-as ${APP_ID} rm -f ${relPath} ${relPath}-wal ${relPath}-shm`)}`,
  );
  sh(
    `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`run-as ${APP_ID} cp /data/local/tmp/${label}.db ${relPath}`)}`,
  );
}

/** Last-resort: overwrite partial/empty SQLite with full boot schema (CI slow RN boot). */
function provisionAndroidBootDb(serial, absPath) {
  const tmpPath = path.join(os.tmpdir(), `tracebud-maestro-provision-${process.pid}-${Date.now()}.db`);
  if (!fs.existsSync(BOOT_SCHEMA_SQL)) {
    throw new Error(`Missing Android boot schema SQL at ${BOOT_SCHEMA_SQL}`);
  }
  sh(`sqlite3 ${JSON.stringify(tmpPath)} < ${JSON.stringify(BOOT_SCHEMA_SQL)}`);
  const relPath = absPath.replace(`${androidDataRoot()}/`, '');

  try {
    pushDbViaRunAs(serial, relPath, tmpPath, 'tracebud-maestro-provision');
    fs.unlinkSync(tmpPath);
    if (relPathExistsRunAs(serial, relPath) && androidDbSettingsTableReady(serial, relPath)) {
      console.log(`Provisioned full boot schema DB via run-as at ${relPath}`);
      return relPath;
    }
  } catch {
    // fall through to root + chown
  }

  try {
    const dirAbs = path.posix.dirname(absPath);
    tryEnableAdbRoot(serial);
    sh(`adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`mkdir -p ${dirAbs}`)}`);
    sh(
      `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`rm -f ${absPath} ${absPath}-wal ${absPath}-shm`)}`,
    );
    sh(
      `adb -s ${JSON.stringify(serial)} push ${JSON.stringify(tmpPath)} /data/local/tmp/tracebud-maestro-provision.db`,
    );
    sh(
      `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`cp /data/local/tmp/tracebud-maestro-provision.db ${absPath}`)}`,
    );
    fixRootCopiedDbOwnership(serial, absPath);
    fs.unlinkSync(tmpPath);
    if (shellTestFile(serial, absPath) && androidDbSettingsTableReady(serial, absPath)) {
      console.log(`Provisioned full boot schema DB at ${absPath} (ownership fixed)`);
      return absPath;
    }
  } catch {
    // exhausted
  }

  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  return null;
}

/**
 * Pull the DB to a temp file and check whether the `settings` table exists.
 * Returns true only when the file is readable and migrations have completed.
 */
function androidDbSettingsTableReady(serial, dbPath) {
  const tmpPath = path.join(
    os.tmpdir(),
    `tracebud-maestro-check-${process.pid}-${Date.now()}.db`,
  );
  try {
    readDbToHost(serial, dbPath, tmpPath);
    const tables = sh(`sqlite3 ${JSON.stringify(tmpPath)} ".tables"`);
    return tables.includes('settings');
  } catch {
    return false;
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // ignore
    }
  }
}

export function waitForAndroidTracebudDb(serial, options = {}) {
  const waitMs = Number(options.waitMs ?? process.env.MAESTRO_SEED_DB_WAIT_MS ?? 120_000);
  const pollMs = Number(options.pollMs ?? 500);
  const forceProvision =
    options.forceProvision === true || process.env.MAESTRO_ANDROID_FORCE_PROVISION === '1';
  const started = Date.now();
  let attempts = 0;
  let relaunched = false;
  let settingsNotReadySince = null;
  const defaultAbs = toAndroidDbAbsPath(REL_CANDIDATES[0]);

  if (forceProvision) {
    console.log('Force-provisioning Android boot schema (skip app-init DB wait)');
    try {
      sh(`adb -s ${JSON.stringify(serial)} shell am force-stop ${APP_ID}`);
    } catch {
      // app may not be running yet
    }
    sleepMs(1000);
    sh(
      `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`run-as ${APP_ID} mkdir -p files/SQLite`)}`,
    );
    const provisioned = provisionAndroidBootDb(serial, defaultAbs);
    if (provisioned) return provisioned;
    throw new Error('Force-provision of Android boot schema failed');
  }

  const maybeRelaunchForDb = () => {
    if (relaunched || !androidProcessRunning(serial)) return;
    relaunched = true;
    console.log('DB still missing — relaunching Tracebud once before schema provision');
    try {
      sh(
        `adb -s ${JSON.stringify(serial)} shell am start -W -n ${APP_ID}/.MainActivity`,
      );
    } catch {
      sh(
        `adb -s ${JSON.stringify(serial)} shell monkey -p ${APP_ID} -c android.intent.category.LAUNCHER 1`,
      );
    }
  };

  while (Date.now() - started < waitMs) {
    attempts += 1;
    const dbPath = findAndroidTracebudDb(serial);
    if (dbPath) {
      if (androidDbSettingsTableReady(serial, dbPath)) {
        settingsNotReadySince = null;
        console.log(
          `Found tracebud_offline.db with settings table after ${attempts} attempt(s): ${dbPath}`,
        );
        return dbPath;
      }
      if (!settingsNotReadySince) settingsNotReadySince = Date.now();
      const stalledMs = Date.now() - settingsNotReadySince;
      const elapsedS = Math.round((Date.now() - started) / 1000);
      console.log(
        `DB found but settings table not yet ready (attempt ${attempts}, ${elapsedS}s elapsed) — waiting for migrations...`,
      );
      if (stalledMs >= 30_000) {
        console.log('Settings table still missing after 30s — provisioning full boot schema');
        break;
      }
    } else {
      settingsNotReadySince = null;
      if (Date.now() - started > waitMs / 2) {
        maybeRelaunchForDb();
      }
    }
    sleepMs(pollMs);
  }

  if (androidProcessRunning(serial) || findAndroidTracebudDb(serial)) {
    console.log('SQLite wait timed out — force-stopping app and provisioning full boot schema');
    try {
      sh(`adb -s ${JSON.stringify(serial)} shell am force-stop ${APP_ID}`);
    } catch {
      // continue
    }
    sleepMs(2000);
    const provisioned = provisionAndroidBootDb(serial, defaultAbs);
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
  const relPath = absPath.replace(`${androidDataRoot()}/`, '');
  try {
    pushDbViaRunAs(serial, relPath, tmpPath, 'tracebud-maestro-seed');
    return;
  } catch {
    // fall back to root copy + ownership fix for emulators where run-as cp fails
  }
  tryEnableAdbRoot(serial);
  sh(
    `adb -s ${JSON.stringify(serial)} push ${JSON.stringify(tmpPath)} /data/local/tmp/tracebud-maestro-seed.db`,
  );
  sh(
    `adb -s ${JSON.stringify(serial)} shell ${JSON.stringify(`cp /data/local/tmp/tracebud-maestro-seed.db ${absPath}`)}`,
  );
  fixRootCopiedDbOwnership(serial, absPath);
}

function ensureHostBootSchema(dbPath) {
  sh(`sqlite3 ${JSON.stringify(dbPath)} < ${JSON.stringify(BOOT_SCHEMA_SQL)}`);
}

export function applyAndroidBootSettings(serial, dbPath, settings) {
  const tmpPath = path.join(os.tmpdir(), `tracebud-maestro-${process.pid}-${Date.now()}.db`);
  readDbToHost(serial, dbPath, tmpPath);
  try {
    sh(`sqlite3 ${JSON.stringify(tmpPath)} ${JSON.stringify('SELECT 1 FROM settings LIMIT 1')}`);
  } catch {
    console.log('Host DB missing settings table — applying boot schema before seed');
    ensureHostBootSchema(tmpPath);
  }
  applySettingsOnHost(tmpPath, settings);
  writeHostDbToDevice(serial, dbPath, tmpPath);
  fs.unlinkSync(tmpPath);
}

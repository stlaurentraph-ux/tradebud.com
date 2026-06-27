#!/usr/bin/env node
/**
 * Apply a Maestro boot profile from qa/automation-baselines/maestro-boot-state.json.
 * Supports iOS simulator (xcrun) and Android emulator (adb run-as).
 *
 * Env: MAESTRO_BOOT_PROFILE (default: golden_path_minimal)
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(root, 'qa/automation-baselines/maestro-boot-state.json');
const DB_WAIT_MS = Number(process.env.MAESTRO_SEED_DB_WAIT_MS ?? 45_000);
const DB_POLL_MS = 500;

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function sleep(ms) {
  execSync(`sleep ${Math.ceil(ms / 1000)}`);
}

function loadBaseline() {
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

function resolveProfile(baseline) {
  const profileId = (process.env.MAESTRO_BOOT_PROFILE ?? baseline.goldenPathBootProfile ?? '').trim();
  const profile = baseline.profiles?.[profileId];
  if (!profile) {
    throw new Error(`Unknown Maestro boot profile: ${profileId}`);
  }
  return { profileId, profile };
}

function sqlFile(dbPath, statement) {
  const oneLine = statement.replace(/\s+/g, ' ').trim();
  sh(`sqlite3 ${JSON.stringify(dbPath)} ${JSON.stringify(oneLine)}`);
}

function applySettings(dbPath, settings) {
  sqlFile(dbPath, 'PRAGMA journal_mode = WAL;');
  for (const [key, value] of Object.entries(settings)) {
    const escaped = String(value).replace(/'/g, "''");
    sqlFile(
      dbPath,
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('${key}', '${escaped}')`,
    );
  }
}

function findIosDb(deviceId) {
  const appsRoot = path.join(
    process.env.HOME,
    'Library/Developer/CoreSimulator/Devices',
    deviceId,
    'data/Containers/Data/Application',
  );
  if (!fs.existsSync(appsRoot)) return null;
  for (const appId of fs.readdirSync(appsRoot)) {
    const dbPath = path.join(appId, 'Documents/SQLite/tracebud_offline.db');
    const full = path.join(appsRoot, dbPath);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function waitForIosDb(deviceId) {
  const started = Date.now();
  while (Date.now() - started < DB_WAIT_MS) {
    const dbPath = findIosDb(deviceId);
    if (dbPath) return dbPath;
    sleep(DB_POLL_MS);
  }
  throw new Error('tracebud_offline.db not found on iOS simulator after bootstrap launch.');
}

function findBootedIosDeviceId() {
  const deviceId = process.env.MAESTRO_DEVICE_ID?.trim();
  if (deviceId) return deviceId;
  const out = sh('xcrun simctl list devices booted');
  const match = out.match(/\(([0-9A-F-]{36})\) \(Booted\)/i);
  if (!match) throw new Error('No booted iOS simulator.');
  return match[1];
}

function androidSerial() {
  return (
    process.env.MAESTRO_ANDROID_SERIAL?.trim() ||
    process.env.ANDROID_SERIAL?.trim() ||
    sh("adb devices | awk 'NR>1 && $2==\"device\" { print $1; exit }'")
  );
}

function findAndroidDb(serial) {
  try {
    const out = sh(
      `adb -s ${JSON.stringify(serial)} shell run-as com.tracebud.app find . -name tracebud_offline.db 2>/dev/null | head -1`,
    );
    const rel = out.split('\n').find((line) => line.includes('tracebud_offline.db'));
    if (!rel) return null;
    return rel.trim();
  } catch {
    return null;
  }
}

function waitForAndroidDb(serial) {
  const started = Date.now();
  while (Date.now() - started < DB_WAIT_MS) {
    const rel = findAndroidDb(serial);
    if (rel) return rel;
    sleep(DB_POLL_MS);
  }
  throw new Error('tracebud_offline.db not found on Android emulator after bootstrap launch.');
}

function applyAndroidSettings(serial, relPath, settings) {
  const stmts = ["PRAGMA journal_mode = WAL;"];
  for (const [key, value] of Object.entries(settings)) {
    const escaped = String(value).replace(/'/g, "''");
    stmts.push(
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('${key}', '${escaped}');`,
    );
  }
  const script = stmts.join(' ');
  sh(
    `adb -s ${JSON.stringify(serial)} shell run-as com.tracebud.app sqlite3 ${JSON.stringify(relPath)} ${JSON.stringify(script)}`,
  );
}

function main() {
  const baseline = loadBaseline();
  const { profileId, profile } = resolveProfile(baseline);
  const platform = (process.env.MAESTRO_BOOT_PLATFORM ?? '').trim().toLowerCase();

  if (platform === 'android' || process.env.MAESTRO_ANDROID_SERIAL || process.env.ANDROID_SERIAL) {
    const serial = androidSerial();
    if (!serial) throw new Error('No Android device for Maestro boot profile seed.');
    const relPath = waitForAndroidDb(serial);
    applyAndroidSettings(serial, relPath, profile.settings);
    console.log(`Maestro boot profile "${profileId}" applied on Android (${relPath})`);
    return;
  }

  const deviceId = findBootedIosDeviceId();
  const dbPath = waitForIosDb(deviceId);
  applySettings(dbPath, profile.settings);
  console.log(`Maestro boot profile "${profileId}" applied on iOS (${dbPath})`);
}

main();

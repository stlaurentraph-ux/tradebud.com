#!/usr/bin/env node
/**
 * Apply a Maestro boot profile from qa/automation-baselines/maestro-boot-state.json.
 * Supports iOS simulator (xcrun) and Android emulator (adb run-as).
 *
 * Env: MAESTRO_BOOT_PROFILE (default: golden_path_minimal)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  androidSerial,
  applyAndroidBootSettings,
  waitForAndroidTracebudDb,
} from './maestro-android-db-path.mjs';
import {
  findBootedIosDeviceId,
  sh,
  waitForIosTracebudDb,
} from './maestro-ios-db-path.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(root, 'qa/automation-baselines/maestro-boot-state.json');
const DB_WAIT_MS = Number(process.env.MAESTRO_SEED_DB_WAIT_MS ?? 120_000);
const DB_POLL_MS = 500;

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
  for (const [key, value] of Object.entries(settings)) {
    const escaped = String(value).replace(/'/g, "''");
    sqlFile(
      dbPath,
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('${key}', '${escaped}')`,
    );
  }
}

function main() {
  const baseline = loadBaseline();
  const { profileId, profile } = resolveProfile(baseline);
  const platform = (process.env.MAESTRO_BOOT_PLATFORM ?? '').trim().toLowerCase();

  if (platform === 'android' || process.env.MAESTRO_ANDROID_SERIAL || process.env.ANDROID_SERIAL) {
    const serial = androidSerial();
    if (!serial) throw new Error('No Android device for Maestro boot profile seed.');
    const relPath = waitForAndroidTracebudDb(serial, { waitMs: DB_WAIT_MS, pollMs: DB_POLL_MS });
    applyAndroidBootSettings(serial, relPath, profile.settings);
    console.log(`Maestro boot profile "${profileId}" applied on Android (${relPath})`);
    return;
  }

  const deviceId = findBootedIosDeviceId();
  const dbPath = waitForIosTracebudDb(deviceId, { waitMs: DB_WAIT_MS, pollMs: DB_POLL_MS });
  applySettings(dbPath, profile.settings);
  console.log(`Maestro boot profile "${profileId}" applied on iOS (${dbPath})`);
}

main();

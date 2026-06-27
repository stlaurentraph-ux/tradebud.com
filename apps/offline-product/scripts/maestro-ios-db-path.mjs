#!/usr/bin/env node
/**
 * Locate tracebud_offline.db on a booted iOS simulator (recursive search).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

export function sleepMs(ms) {
  execSync(`sleep ${Math.max(1, Math.ceil(ms / 1000))}`);
}

export function findBootedIosDeviceId() {
  const deviceId = process.env.MAESTRO_DEVICE_ID?.trim();
  if (deviceId) return deviceId;

  const out = sh('xcrun simctl list devices booted');
  const match = out.match(/\(([0-9A-F-]{36})\) \(Booted\)/i);
  if (!match) throw new Error('No booted iOS simulator.');
  return match[1];
}

export function iosApplicationContainersRoot(deviceId) {
  return path.join(
    process.env.HOME,
    'Library/Developer/CoreSimulator/Devices',
    deviceId,
    'data/Containers/Data/Application',
  );
}

/** Walk app sandboxes — expo-sqlite path varies by SDK (Documents/SQLite, Library, etc.). */
export function findIosTracebudDb(deviceId) {
  const appsRoot = iosApplicationContainersRoot(deviceId);
  if (!fs.existsSync(appsRoot)) return null;

  for (const appUuid of fs.readdirSync(appsRoot)) {
    const appRoot = path.join(appsRoot, appUuid);
    if (!fs.statSync(appRoot).isDirectory()) continue;

    const direct = path.join(appRoot, 'Documents/SQLite/tracebud_offline.db');
    if (fs.existsSync(direct)) return direct;

    try {
      const found = sh(`find ${JSON.stringify(appRoot)} -name tracebud_offline.db 2>/dev/null | head -1`);
      if (found) return found;
    } catch {
      // keep scanning other app containers
    }
  }

  return null;
}

export function waitForIosTracebudDb(deviceId, options = {}) {
  const waitMs = Number(options.waitMs ?? process.env.MAESTRO_SEED_DB_WAIT_MS ?? 120_000);
  const pollMs = Number(options.pollMs ?? 500);
  const started = Date.now();
  let attempts = 0;

  while (Date.now() - started < waitMs) {
    attempts += 1;
    const dbPath = findIosTracebudDb(deviceId);
    if (dbPath) {
      console.log(`Found tracebud_offline.db after ${attempts} attempt(s): ${dbPath}`);
      return dbPath;
    }
    sleepMs(pollMs);
  }

  const appsRoot = iosApplicationContainersRoot(deviceId);
  throw new Error(
    `tracebud_offline.db not found on iOS simulator after ${waitMs}ms (${attempts} attempts). ` +
      `Containers scanned under ${appsRoot}`,
  );
}

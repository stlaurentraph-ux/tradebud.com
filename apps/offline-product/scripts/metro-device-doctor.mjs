#!/usr/bin/env node
/**
 * Diagnose Metro + physical iPhone debug setup before opening the app.
 * Run: npm run dev:metro:doctor
 */
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(filePath, override = false) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (override || !process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, '.env'));
loadEnvFile(path.join(root, '.env.local'), true);
loadEnvFile(path.join(root, '.env.development.local'), true);

const lanIp =
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME?.trim() ||
  execSync('ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null', {
    encoding: 'utf8',
  }).trim();

const metroPort = 8081;
let failed = false;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  console.error(`  ✗ ${msg}`);
  failed = true;
};
const hint = (msg) => console.log(`    → ${msg}`);

function portListening(port) {
  try {
    execSync(`lsof -i :${port} -sTCP:LISTEN`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function fetchOk(url, timeoutMs = 4000) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return res.ok;
  } catch {
    return false;
  }
}

console.log('\nMetro + iPhone debug doctor\n');

spawnSync('node', ['./scripts/validate-metro-start.mjs'], { cwd: root, stdio: 'inherit' });

if (!lanIp) {
  fail('Mac LAN IP not detected — connect Mac and iPhone to the same Wi‑Fi');
} else {
  ok(`Mac LAN IP: ${lanIp}`);
}

try {
  const ip = execSync('bash ./scripts/write-xcode-lan-env.sh', { cwd: root, encoding: 'utf8' }).trim();
  if (ip && ip !== lanIp) ok(`Refreshed Xcode packager host: ${ip}`);
  else ok(`Xcode packager host synced: ${lanIp}`);
} catch (error) {
  fail(`write-xcode-lan-env.sh failed: ${error instanceof Error ? error.message : String(error)}`);
}

const xcodeEnvPath = path.join(root, 'ios/.xcode.env.local');
if (!fs.existsSync(xcodeEnvPath)) {
  fail('ios/.xcode.env.local missing');
} else {
  const host = /REACT_NATIVE_PACKAGER_HOSTNAME=(\S+)/.exec(fs.readFileSync(xcodeEnvPath, 'utf8'))?.[1];
  if (host === lanIp) ok(`ios/.xcode.env.local → ${host}`);
  else fail(`Xcode host (${host}) ≠ LAN IP (${lanIp})`);
}

const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const isProductionApi = apiUrl.includes('api.tracebud.com');
if (!apiUrl) {
  fail('EXPO_PUBLIC_API_URL missing');
} else if (isProductionApi) {
  ok(`API: ${apiUrl} (production — no local backend needed)`);
  if (await fetchOk(`${apiUrl}/health`)) ok('Production API health OK');
  else fail('Production API not reachable');
} else {
  ok(`API: ${apiUrl}`);
  try {
    const host = new URL(apiUrl).hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      fail('Physical iPhone cannot use localhost API — use LAN IP or dev:metro:production');
    } else if (lanIp && host !== lanIp) {
      fail(`API host (${host}) ≠ Mac LAN (${lanIp})`);
    }
  } catch {
    fail(`Invalid EXPO_PUBLIC_API_URL: ${apiUrl}`);
  }
}

if (!fs.existsSync(path.join(root, 'node_modules/react-native'))) {
  fail('node_modules missing — run: npm install');
} else {
  ok('node_modules present');
}

if (portListening(metroPort)) {
  ok(`Metro listening on :${metroPort}`);
  if (await fetchOk(`http://127.0.0.1:${metroPort}/status`)) ok('Metro status (localhost)');
  if (lanIp && (await fetchOk(`http://${lanIp}:${metroPort}/status`))) ok(`Metro status (LAN ${lanIp})`);
  else if (lanIp) {
    fail(`Metro not reachable on LAN http://${lanIp}:${metroPort}`);
    hint('Allow Node.js in System Settings → Network → Firewall');
  }
} else {
  fail(`Metro not running on :${metroPort}`);
  hint('Terminal 1: npm run dev:metro:production');
}

let usbDevice = '';
try {
  const devices = execSync('xcrun xctrace list devices 2>/dev/null', { encoding: 'utf8' });
  const line = devices.split('\n').find((row) => /iPhone|iPad/.test(row) && !/Simulator/.test(row));
  usbDevice = line?.trim() ?? '';
  if (usbDevice) ok(`USB device: ${usbDevice}`);
  else console.log('  ⚠ No USB iPhone detected (Wi‑Fi-only is OK if debug app already installed)');
} catch {
  console.log('  ⚠ Could not list USB devices');
}

console.log('\nImportant:\n');
console.log('  • Expo Go does NOT work — use a debug build (npm run dev:device).');
console.log('  • TestFlight / preview apps do NOT load from Metro.');
console.log('  • If you see "No script URL provided", reinstall: npm run dev:device\n');

console.log('Workflow:\n');
console.log('  Terminal 1: npm run dev:metro:production');
console.log('  Terminal 2: npm run dev:device          # USB install (when native code or IP changed)');
console.log('  On phone:   open the debug Tracebud app → shake → Reload JS\n');

if (!portListening(metroPort)) {
  hint('Start Metro now: npm run dev:metro:production');
}

process.exit(failed ? 1 : 0);

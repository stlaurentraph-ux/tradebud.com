#!/usr/bin/env node
/**
 * Physical iPhone dev preflight — LAN IP, Metro, backend, env alignment.
 * Run: npm run dev
 */
import { execSync } from 'node:child_process';
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

const lanIp =
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME?.trim() ||
  execSync('ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null', {
    encoding: 'utf8',
  }).trim();

let failed = false;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  console.error(`  ✗ ${msg}`);
  failed = true;
};
const hint = (msg) => console.log(`    → ${msg}`);

console.log('\nTracebud field app — iPhone dev check\n');

if (!lanIp) {
  fail('Could not detect Mac LAN IP — connect to Wi‑Fi');
} else {
  ok(`Mac LAN IP: ${lanIp}`);
}

const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const isProductionApi = apiUrl.includes('api.tracebud.com');
if (!apiUrl) {
  fail('EXPO_PUBLIC_API_URL missing in .env.local');
} else if (isProductionApi) {
  ok(`API URL: ${apiUrl} (production — Metro bundles against live API)`);
} else {
  let apiHost = '';
  try {
    apiHost = new URL(apiUrl).hostname;
  } catch {
    fail(`Invalid EXPO_PUBLIC_API_URL: ${apiUrl}`);
  }
  if (apiHost === 'localhost' || apiHost === '127.0.0.1') {
    fail(`EXPO_PUBLIC_API_URL uses ${apiHost} — physical iPhone cannot reach localhost`);
    hint(`Set EXPO_PUBLIC_API_URL=http://${lanIp || '<your-ip>'}:4000/api in .env.local`);
  } else if (lanIp && apiHost !== lanIp) {
    fail(`EXPO_PUBLIC_API_URL host (${apiHost}) ≠ Mac LAN IP (${lanIp})`);
    hint(`Update .env.local and run: bash ./scripts/write-xcode-lan-env.sh`);
  } else {
    ok(`API URL: ${apiUrl}`);
  }
}

const xcodeEnvPath = path.join(root, 'ios/.xcode.env.local');
if (!fs.existsSync(xcodeEnvPath)) {
  fail('ios/.xcode.env.local missing');
  hint('Run: bash ./scripts/write-xcode-lan-env.sh');
} else {
  const xcodeEnv = fs.readFileSync(xcodeEnvPath, 'utf8');
  const hostMatch = /REACT_NATIVE_PACKAGER_HOSTNAME=(\S+)/.exec(xcodeEnv);
  const xcodeHost = hostMatch?.[1] ?? '';
  if (lanIp && xcodeHost && xcodeHost !== lanIp) {
    fail(`Xcode packager host (${xcodeHost}) ≠ Mac LAN IP (${lanIp})`);
    hint('Run: bash ./scripts/write-xcode-lan-env.sh');
  } else {
    ok(`Xcode Metro host: ${xcodeHost || lanIp}`);
  }
}

function portListening(port) {
  try {
    execSync(`lsof -i :${port} -sTCP:LISTEN`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const metroPort = 8081;
const apiPort = 4000;

if (portListening(metroPort)) {
  ok(`Metro listening on :${metroPort} (http://${lanIp}:${metroPort})`);
} else {
  fail(`Metro not running on :${metroPort}`);
  hint('Terminal 1: npm run dev:metro');
}

if (portListening(apiPort)) {
  ok(`Backend listening on :${apiPort}`);
} else if (isProductionApi) {
  console.log(`  ⚠ Local backend not on :${apiPort} (OK for dev:metro:production)`);
} else {
  fail(`Backend not running on :${apiPort}`);
  hint('Terminal 2: cd ../../tracebud-backend && npm run start:dev');
}

if (apiUrl) {
  try {
    const health = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(4000) });
    if (health.ok) ok('API health check passed');
    else fail(`API health returned ${health.status}`);
  } catch {
    fail(`API not reachable at ${apiUrl}/health`);
  }
}

try {
  const fw = execSync('/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null', {
    encoding: 'utf8',
  }).trim();
  if (/enabled/i.test(fw)) {
    console.log('  ⚠ macOS Firewall is on — if iPhone Safari cannot open API /health, allow Node.js incoming connections');
    hint('System Settings → Network → Firewall → Options → allow node');
  }
} catch {
  // ignore
}

if (lanIp && portListening(metroPort)) {
  try {
    const metro = await fetch(`http://${lanIp}:${metroPort}/status`, { signal: AbortSignal.timeout(4000) });
    if (metro.ok) ok('Metro reachable on LAN');
    else fail(`Metro LAN status returned ${metro.status}`);
  } catch {
    fail(`Metro not reachable at http://${lanIp}:${metroPort}`);
    hint('Same Wi‑Fi for Mac and iPhone; allow Node in macOS Firewall if prompted');
  }
}

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  fail('Supabase env missing in .env.local');
} else {
  ok('Supabase env present');
}

console.log('\nPhysical iPhone workflow:\n');
console.log('  1. npm run dev:metro:production  # keep running (prod API)');
console.log('  2. npm run dev:device              # USB debug install (native/IP changes)');
console.log('  3. Open debug app on phone → shake → Reload JS\n');
console.log('Preview/TestFlight builds do NOT use Metro — use dev:device for local UI work.\n');
console.log('Run npm run dev:metro:doctor for a full Metro + device checklist.\n');

process.exit(failed ? 1 : 0);

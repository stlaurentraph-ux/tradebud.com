#!/usr/bin/env node
/**
 * Check Tracebud API + Supabase reachability (same checks the field app uses).
 * Run: npm run qa:sync-connectivity
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, '.env'));
loadEnvFile(path.join(root, '.env.local'));

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.tracebud.com/api').replace(
  /\/$/,
  '',
);
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
const PROD_API = 'https://api.tracebud.com/api';

let failed = false;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  console.error(`  ✗ ${msg}`);
  failed = true;
};
const hint = (msg) => console.log(`    → ${msg}`);

console.log('\nTracebud sync connectivity\n');

try {
  const health = await fetch(`${API_URL}/health`, {
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  if (health.ok || health.status === 304) ok(`App API health: ${API_URL}/health`);
  else fail(`App API health returned ${health.status} (${API_URL})`);
} catch (e) {
  fail(`App API unreachable: ${API_URL} (${e instanceof Error ? e.message : e})`);
  if (API_URL.startsWith('http://')) {
    hint('iPhone blocks http:// LAN unless the app was rebuilt after ATS config (npm run dev:device)');
    hint('Allow Node.js in macOS Firewall → System Settings → Network → Firewall → Options');
    hint('Or use production API: EXPO_PUBLIC_API_URL=https://api.tracebud.com/api npm run dev:oauth:device');
  }
}

try {
  const prod = await fetch(`${PROD_API}/health`, {
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  if (prod.ok || prod.status === 304) ok(`Production API health: ${PROD_API}/health`);
  else fail(`Production API health returned ${prod.status}`);
} catch (e) {
  fail(`Production API unreachable (${e instanceof Error ? e.message : e})`);
}

if (!SUPABASE_URL || !SUPABASE_ANON) {
  fail('EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY missing');
} else {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_ANON },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok || res.status === 401) ok(`Supabase auth reachable: ${SUPABASE_URL}`);
    else fail(`Supabase auth returned ${res.status}`);
  } catch (e) {
    fail(`Supabase unreachable (${e instanceof Error ? e.message : e})`);
  }
}

try {
  const res = await fetch(`${API_URL}/v1/plots?farmerId=probe`, {
    headers: { Authorization: 'Bearer invalid' },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 401) ok('Authenticated plot API responds (401 without token — expected)');
  else fail(`Plot API unexpected status ${res.status} (expected 401 without token)`);
} catch (e) {
  fail(`Plot API unreachable (${e instanceof Error ? e.message : e})`);
}

console.log('\nOn your iPhone, open Safari and visit:');
console.log(`  ${API_URL}/health`);
console.log('If Safari fails but this script passes, rebuild the app (npm run dev:device) or check VPN / Private Relay.\n');

process.exit(failed ? 1 : 0);

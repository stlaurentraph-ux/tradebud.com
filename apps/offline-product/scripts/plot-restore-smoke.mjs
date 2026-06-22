#!/usr/bin/env node
/**
 * Verify production plot list includes geometry for cloud restore (Phase 1).
 * Run: npm run qa:plot-restore-smoke
 *
 * Credentials (first match wins):
 *   EXPO_PUBLIC_TRACEBUD_TEST_EMAIL / EXPO_PUBLIC_TRACEBUD_TEST_PASSWORD
 *   FIELD_TENANT_SMOKE_FARMER_A_EMAIL / FIELD_TENANT_SMOKE_FARMER_A_PASSWORD
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

for (const name of ['.env', '.env.local', '.env.development.local']) {
  loadEnvFile(path.join(root, name));
}

const API_URL = (
  process.env.FIELD_TENANT_SMOKE_API_URL ??
  process.env.EXPO_PUBLIC_API_URL ??
  'https://api.tracebud.com/api'
).replace(/\/$/, '');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

const email =
  process.env.EXPO_PUBLIC_TRACEBUD_TEST_EMAIL?.trim() ||
  process.env.FIELD_TENANT_SMOKE_FARMER_A_EMAIL?.trim();
const password =
  process.env.EXPO_PUBLIC_TRACEBUD_TEST_PASSWORD?.trim() ||
  process.env.FIELD_TENANT_SMOKE_FARMER_A_PASSWORD?.trim();

let failed = false;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  console.error(`  ✗ ${msg}`);
  failed = true;
};

console.log('\nPlot restore smoke (production geometry in plot list)\n');

if (!SUPABASE_URL || !SUPABASE_ANON) {
  fail('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

if (!email || !password) {
  console.log('  ⊘ Skipped — set EXPO_PUBLIC_TRACEBUD_TEST_EMAIL/PASSWORD in .env.local');
  process.exit(0);
}

let accessToken;
try {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    fail(`Supabase sign-in failed (${res.status})`);
    process.exit(1);
  }
  accessToken = body.access_token;
  if (!accessToken) {
    fail('Supabase sign-in returned no access_token');
    process.exit(1);
  }
  ok('Signed in to Supabase');
} catch (e) {
  fail(`Supabase sign-in error: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
}

let farmerIds = [];
try {
  const res = await fetch(`${API_URL}/v1/me/field-farmer-ids`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    fail(`field-farmer-ids returned ${res.status}`);
    process.exit(1);
  }
  const body = await res.json();
  farmerIds = Array.isArray(body?.farmerIds) ? body.farmerIds.map(String) : [];
  if (farmerIds.length === 0 && body?.farmerId) farmerIds = [String(body.farmerId)];
  ok(`Owned farmer ids: ${farmerIds.length}`);
} catch (e) {
  fail(`field-farmer-ids error: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
}

if (farmerIds.length === 0) {
  fail('No farmer ids for signed-in user');
  process.exit(1);
}

let totalPlots = 0;
let withGeometry = 0;

for (const farmerId of farmerIds) {
  try {
    const url = `${API_URL}/v1/plots?farmerId=${encodeURIComponent(farmerId)}&scope=farmer&_=${Date.now()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      fail(`GET /v1/plots for ${farmerId.slice(0, 8)}… returned ${res.status}`);
      continue;
    }
    const rows = await res.json();
    if (!Array.isArray(rows)) {
      fail('Plot list response is not an array');
      continue;
    }
    totalPlots += rows.length;
    for (const row of rows) {
      const geometry = row?.geometry;
      const hasGeometry =
        geometry &&
        typeof geometry === 'object' &&
        (geometry.type === 'Point' || geometry.type === 'Polygon') &&
        Array.isArray(geometry.coordinates);
      if (hasGeometry) withGeometry += 1;
    }
    ok(`Farmer ${farmerId.slice(0, 8)}… — ${rows.length} plot(s)`);
  } catch (e) {
    fail(`Plot list error: ${e instanceof Error ? e.message : e}`);
  }
}

if (totalPlots === 0) {
  console.log('\n  ⊘ No server plots for this account — restore smoke inconclusive');
  process.exit(0);
}

if (withGeometry === totalPlots) {
  ok(`All ${totalPlots} plot(s) include geometry (restore-ready)`);
} else if (withGeometry > 0) {
  fail(`${withGeometry}/${totalPlots} plot(s) have geometry — partial restore risk`);
} else {
  fail(`0/${totalPlots} plot(s) have geometry — restore will not import plots`);
}

console.log('');
process.exit(failed ? 1 : 0);

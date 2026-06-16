#!/usr/bin/env node
/**
 * Smoke: farmer A cannot read or sync farmer B's plots on production API.
 *
 * Requires in apps/offline-product/.env.local (or env):
 *   EXPO_PUBLIC_API_URL=https://api.tracebud.com/api
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY
 *   FIELD_TENANT_SMOKE_FARMER_A_EMAIL / FIELD_TENANT_SMOKE_FARMER_A_PASSWORD
 *   FIELD_TENANT_SMOKE_FARMER_B_ID
 *   FIELD_TENANT_SMOKE_FARMER_B_PLOT_ID
 *
 * Run: npm run qa:tenant-isolation
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function loadEnvFileIfPresent(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

for (const envPath of [
  path.join(projectRoot, '.env.local'),
  path.join(projectRoot, '.env'),
  path.join(projectRoot, '../..', '.env.local'),
]) {
  loadEnvFileIfPresent(envPath);
}

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.tracebud.com/api').replace(/\/$/, '');
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
const farmerAEmail = process.env.FIELD_TENANT_SMOKE_FARMER_A_EMAIL?.trim();
const farmerAPassword = process.env.FIELD_TENANT_SMOKE_FARMER_A_PASSWORD?.trim();
const farmerBId = process.env.FIELD_TENANT_SMOKE_FARMER_B_ID?.trim();
const farmerBPlotId = process.env.FIELD_TENANT_SMOKE_FARMER_B_PLOT_ID?.trim();

function missingCredentials() {
  return !(SUPABASE_URL && SUPABASE_ANON && farmerAEmail && farmerAPassword && farmerBId && farmerBPlotId);
}

async function supabaseToken(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Supabase auth failed for ${email}: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  if (!json.access_token) throw new Error(`No access_token for ${email}`);
  return json.access_token;
}

async function apiRequest(token, pathname, init = {}) {
  const res = await fetch(`${API_URL}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function main() {
  if (missingCredentials()) {
    console.log('SKIP tenant isolation smoke — set FIELD_TENANT_SMOKE_* vars in .env.local');
    console.log('Required: FIELD_TENANT_SMOKE_FARMER_A_EMAIL, _PASSWORD, FARMER_B_ID, FARMER_B_PLOT_ID');
    process.exit(0);
  }

  const tokenA = await supabaseToken(farmerAEmail, farmerAPassword);

  const foreignList = await apiRequest(
    tokenA,
    `/v1/plots?farmerId=${encodeURIComponent(farmerBId)}&scope=farmer`,
  );
  if (foreignList.status === 200) {
    console.error('FAIL farmer A listed farmer B plots', foreignList.body);
    process.exit(1);
  }
  if (foreignList.status !== 403) {
    console.error('FAIL expected 403 on foreign farmer list, got', foreignList.status, foreignList.body);
    process.exit(1);
  }
  console.log('PASS farmer A cannot list farmer B plots (403)');

  const foreignSync = await apiRequest(tokenA, `/v1/plots/${encodeURIComponent(farmerBPlotId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Tenant probe' }),
  });
  if (foreignSync.status < 400) {
    console.error('FAIL farmer A sync to farmer B plot should be denied, got', foreignSync.status);
    process.exit(1);
  }
  console.log(`PASS farmer A foreign plot update denied (${foreignSync.status})`);
  console.log('Tenant isolation smoke passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

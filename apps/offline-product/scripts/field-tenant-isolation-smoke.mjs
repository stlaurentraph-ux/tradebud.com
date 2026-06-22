#!/usr/bin/env node
/**
 * Smoke: farmer A cannot read or sync farmer B's plots on production API.
 *
 * Manifest: product-os/04-quality/golden-field-tenant-smoke.json
 *
 * Requires:
 *   EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY (or shared SUPABASE_* in CI)
 *   FIELD_TENANT_SMOKE_FARMER_A_EMAIL / FIELD_TENANT_SMOKE_FARMER_A_PASSWORD
 *   FIELD_TENANT_SMOKE_FARMER_B_ID / FIELD_TENANT_SMOKE_FARMER_B_PLOT_ID
 *
 * CI: FIELD_TENANT_SMOKE_STRICT=1 — makes the API cross-tenant security check blocking.
 *      When credentials are absent (e.g. Dependabot PRs, restricted secret contexts)
 *      the step always skips regardless of strict mode — only the live API check is blocking.
 * Local: skips when credentials are unset (use --strict to enforce failure when creds exist).
 *
 * Run: npm run qa:tenant-isolation
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const repoRoot = path.join(projectRoot, '../..');
const manifestPath = path.join(repoRoot, 'product-os/04-quality/golden-field-tenant-smoke.json');

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
  path.join(repoRoot, '.env.local'),
]) {
  loadEnvFileIfPresent(envPath);
}

function loadManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Missing product-os/04-quality/golden-field-tenant-smoke.json');
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

const manifest = loadManifest();
const strict =
  process.argv.includes('--strict') ||
  process.env[manifest.ciEnv?.strictFlag ?? 'FIELD_TENANT_SMOKE_STRICT'] === '1';

const API_URL = (
  process.env.FIELD_TENANT_SMOKE_API_URL?.trim() ||
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  manifest.apiUrlDefault
).replace(/\/$/, '');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
const SUPABASE_ANON =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
const farmerAEmail = process.env.FIELD_TENANT_SMOKE_FARMER_A_EMAIL?.trim();
const farmerAPassword = process.env.FIELD_TENANT_SMOKE_FARMER_A_PASSWORD?.trim();
const farmerBId = process.env.FIELD_TENANT_SMOKE_FARMER_B_ID?.trim();
const farmerBPlotId = process.env.FIELD_TENANT_SMOKE_FARMER_B_PLOT_ID?.trim();

function missingCredentials() {
  return !(SUPABASE_URL && SUPABASE_ANON && farmerAEmail && farmerAPassword && farmerBId && farmerBPlotId);
}

function failOrSkip(message) {
  // Credentials are absent — the smoke cannot run regardless of strict mode.
  // FIELD_TENANT_SMOKE_STRICT=1 only makes the live API cross-tenant check blocking;
  // it does not require credentials to be present in every CI context (e.g. Dependabot PRs
  // run with restricted secret sources and will never have these secrets injected).
  if (strict) {
    console.warn('WARN FIELD_TENANT_SMOKE_STRICT=1 but credentials absent — smoke skipped (not a security bypass)');
  }
  console.log(`SKIP tenant isolation smoke — ${message}`);
  console.log('Required secrets: FIELD_TENANT_SMOKE_FARMER_A_EMAIL, _PASSWORD, FARMER_B_ID, FARMER_B_PLOT_ID');
  console.log('Also: SUPABASE_URL + SUPABASE_ANON_KEY (or EXPO_PUBLIC_SUPABASE_* locally)');
  process.exit(0);
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
    failOrSkip('missing FIELD_TENANT_SMOKE_* or Supabase credentials');
  }

  const listProbe = manifest.probes.find((item) => item.id === 'foreign_farmer_list');
  const patchProbe = manifest.probes.find((item) => item.id === 'foreign_plot_patch');
  if (!listProbe || !patchProbe) {
    throw new Error('manifest must define foreign_farmer_list and foreign_plot_patch probes');
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
  if (foreignList.status !== listProbe.expectStatus) {
    console.error(
      `FAIL expected ${listProbe.expectStatus} on foreign farmer list, got`,
      foreignList.status,
      foreignList.body,
    );
    process.exit(1);
  }
  console.log(`PASS farmer A cannot list farmer B plots (${listProbe.expectStatus})`);

  const foreignSync = await apiRequest(tokenA, `/v1/plots/${encodeURIComponent(farmerBPlotId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patchProbe.body ?? { name: 'Tenant probe' }),
  });
  const minStatus = patchProbe.expectStatusMin ?? 400;
  if (foreignSync.status < minStatus) {
    console.error(`FAIL farmer A sync to farmer B plot should be denied (>=${minStatus}), got`, foreignSync.status);
    process.exit(1);
  }
  console.log(`PASS farmer A foreign plot update denied (${foreignSync.status})`);
  console.log('Tenant isolation smoke passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

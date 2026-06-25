#!/usr/bin/env node
/**
 * Checks that required Railway variables are available locally before copy-paste.
 * Does not print secret values.
 */
import fs from 'node:fs';
import path from 'node:path';

const backendRoot = process.cwd();
const repoRoot = path.resolve(backendRoot, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function firstSet(names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return { name, value };
  }
  return null;
}

function mask(value) {
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

const required = [
  {
    railway: 'DATABASE_URL',
    sources: ['DATABASE_URL'],
    hint: 'Tracebud prod pooler (uzsktajlnofosxeqwdwl) — Supabase → Database → URI :6543',
  },
  {
    railway: 'SUPABASE_URL',
    sources: ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL'],
    hint: 'https://YOUR_PROJECT.supabase.co',
  },
  {
    railway: 'SUPABASE_ANON_KEY',
    sources: ['SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'],
    hint: 'Supabase → Settings → API → anon public',
  },
  {
    railway: 'GFW_API_KEY',
    sources: ['GFW_API_KEY'],
    hint: 'https://data-api.globalforestwatch.org/user/login → API keys',
  },
];

loadEnvFile(path.join(backendRoot, '.env'));
loadEnvFile(path.join(backendRoot, '.env.local'));
loadEnvFile(path.join(repoRoot, '.env.local'));
loadEnvFile(path.join(repoRoot, '.env'));

console.log('Railway variable checklist (values masked):\n');

let ok = true;
for (const item of required) {
  const found = firstSet(item.sources);
  if (!found) {
    ok = false;
    console.log(`[MISSING] ${item.railway}`);
    console.log(`          Set in Railway manually. ${item.hint}\n`);
    continue;
  }
  console.log(`[OK]      ${item.railway} ← ${found.name}`);
  console.log(`          ${mask(found.value)}\n`);
}

console.log('Also set in Railway:');
console.log('  NODE_ENV=production');
console.log('  PG_POOL_MAX=5');
console.log('  GFW_BASE_URL, GFW_DATASET, GFW_RADD_DATASET (or run: npm run railway:sync:gfw)');
console.log('(PORT is injected by Railway; do not set EXPO_PUBLIC_* on the API service.)\n');

try {
  const { resolveDatabaseUrl, describeDatabaseUrl, isPoolerDatabaseUrl, validateDatabaseEnvSplit } =
    await import('./db-url-from-env.mjs');
  const url = resolveDatabaseUrl();
  if (!isPoolerDatabaseUrl(url)) {
    console.warn('[warn] DATABASE_URL is not Supabase pooler — use aws-*-*.pooler.supabase.com:6543\n');
  } else {
    console.log(`[OK]      DATABASE_URL uses pooler (${describeDatabaseUrl(url)})\n`);
  }
  const { split, issues } = validateDatabaseEnvSplit();
  if (split.test) {
    console.log(`[OK]      TEST_DATABASE_URL set for integration tests (${split.test.host})\n`);
  }
  for (const issue of issues) {
    if (issue.includes('TEST_DATABASE_URL is missing')) {
      console.warn(`[warn] ${issue} (optional until you run test:integration)\n`);
    } else {
      console.warn(`[warn] ${issue}\n`);
    }
  }
} catch {
  // resolveDatabaseUrl errors handled by required check above
}

const poolMax = Number(process.env.PG_POOL_MAX ?? 5);
if (!Number.isFinite(poolMax) || poolMax > 10) {
  console.warn(`[warn] PG_POOL_MAX=${process.env.PG_POOL_MAX ?? '(unset)'} — recommend 3–8 on Supabase\n`);
} else if (!process.env.PG_POOL_MAX) {
  console.log('[OK]      PG_POOL_MAX will default to 5 in API code\n');
}

if (process.env.EXPO_PUBLIC_ALLOW_TEST_AUTH === '1') {
  console.warn('[warn] EXPO_PUBLIC_ALLOW_TEST_AUTH=1 is set locally — do NOT add to Railway.\n');
}

if (!ok) {
  console.error('Preflight failed: add missing values to repo .env.local or tracebud-backend/.env.local, then re-run.');
  process.exit(1);
}

console.log('Local preflight passed. Copy secrets into Railway → Variables, then deploy.');
console.log('GFW sync shortcut (after railway login + link): npm run railway:sync:gfw');
console.log('Verify GFW: npm run check:gfw');
console.log('Guide: tracebud-backend/RAILWAY_QUICKSTART.md');

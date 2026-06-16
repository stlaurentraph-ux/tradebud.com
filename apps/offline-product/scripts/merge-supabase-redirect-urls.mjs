#!/usr/bin/env node
/**
 * Merge field-app + dashboard redirect URLs into Supabase Auth (uri_allow_list).
 * Does not change Google/Apple provider secrets.
 *
 *   SUPABASE_ACCESS_TOKEN in .env.local, or:
 *   export SUPABASE_ACCESS_TOKEN=...  # https://supabase.com/dashboard/account/tokens
 *   node scripts/merge-supabase-redirect-urls.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(projectRoot, '../..');

function loadEnvFileIfPresent(filePath) {
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

for (const envPath of [
  path.join(projectRoot, '.env.local'),
  path.join(projectRoot, '.env'),
  path.join(repoRoot, '.env.local'),
]) {
  loadEnvFileIfPresent(envPath);
}

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF?.trim() || 'uzsktajlnofosxeqwdwl';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN?.trim();

const REQUIRED_REDIRECTS = [
  'tracebudoffline://auth/callback',
  'tracebudoffline://**',
  'exp://**',
  'exp://**/--/auth/callback',
  'https://dashboard.tracebud.com/**',
];

if (!ACCESS_TOKEN) {
  console.error('Missing SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

function parseAllowList(raw) {
  return String(raw ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function allowListHasPattern(allowList, pattern) {
  return allowList.some((entry) => entry === pattern);
}

async function main() {
  const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const getRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    headers,
  });
  if (!getRes.ok) {
    console.error('GET failed:', await getRes.text());
    process.exit(1);
  }

  const current = await getRes.json();
  const existing = parseAllowList(current.uri_allow_list);
  const merged = [...existing];

  for (const required of REQUIRED_REDIRECTS) {
    if (!allowListHasPattern(merged, required)) merged.push(required);
  }

  const patchRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ uri_allow_list: merged.join(',') }),
  });

  if (!patchRes.ok) {
    console.error('PATCH failed:', await patchRes.text());
    process.exit(1);
  }

  const updated = await patchRes.json();
  console.log('Supabase redirect URLs updated for', PROJECT_REF);
  console.log('uri_allow_list:', updated.uri_allow_list ?? merged.join(','));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

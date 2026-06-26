#!/usr/bin/env node
/**
 * Guard: SSO auth.users rows must not have NULL token columns (Supabase Auth 500 on /token).
 *
 * Requires SUPABASE_ACCESS_TOKEN + EXPO_PUBLIC_SUPABASE_URL (or SUPABASE_PROJECT_REF).
 * Skips with warning when credentials are absent unless --strict.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const SSO_NULL_TOKEN_QUERY = `
SELECT id, email
FROM auth.users
WHERE is_sso_user = true
  AND (
    confirmation_token IS NULL
    OR recovery_token IS NULL
    OR email_change_token_new IS NULL
    OR email_change IS NULL
  )
LIMIT 20;
`.trim();

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

function projectRefFromUrl(url) {
  try {
    return new URL(url).hostname.split('.')[0] || null;
  } catch {
    return null;
  }
}

async function runManagementQuery(projectRef, accessToken, query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`Management SQL failed (${res.status}): ${bodyText.slice(0, 400)}`);
  }
  try {
    return JSON.parse(bodyText);
  } catch {
    throw new Error(`Unexpected management SQL response: ${bodyText.slice(0, 400)}`);
  }
}

async function main() {
  loadEnvFile(path.join(root, '.env'));
  loadEnvFile(path.join(root, '.env.local'));

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const projectRef =
    process.env.SUPABASE_PROJECT_REF?.trim() ||
    projectRefFromUrl(process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '');

  if (!accessToken || !projectRef) {
    const msg =
      'oauth-sso-health-check: skipped (set SUPABASE_ACCESS_TOKEN + EXPO_PUBLIC_SUPABASE_URL)';
    if (strict) {
      console.error(`[fail] ${msg}`);
      process.exit(1);
    }
    console.warn(`[warn] ${msg}`);
    process.exit(0);
  }

  const rows = await runManagementQuery(projectRef, accessToken, SSO_NULL_TOKEN_QUERY);
  const offenders = Array.isArray(rows) ? rows : [];

  if (offenders.length === 0) {
    console.log('[ok] SSO auth.users: no NULL token columns');
    process.exit(0);
  }

  console.error('[fail] SSO auth.users with NULL token columns (causes Google/Apple sign-in 500):');
  for (const row of offenders) {
    console.error(`  → ${row.email ?? row.id}`);
  }
  console.error('');
  console.error('Fix: apply supabase/migrations/202606221430_fix_sso_auth_user_null_token_columns.sql');
  process.exit(1);
}

main().catch((error) => {
  console.error(`[fail] oauth-sso-health-check: ${error.message}`);
  process.exit(1);
});

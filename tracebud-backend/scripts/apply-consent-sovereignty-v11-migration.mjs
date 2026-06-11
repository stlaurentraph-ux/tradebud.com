#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

const SQL_FILES = [
  'tb_v16_040_crm_contacts_farmer_profile.sql',
  'tb_v16_041_consent_grants_rls.sql',
  'tb_v16_042_farmer_push_devices.sql',
];

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = stripQuotes(trimmed.slice(eq + 1).trim());
    if (value) out[key] = value;
  }
  return out;
}

function loadSql(name) {
  const sqlPath = resolve(process.cwd(), 'sql', name);
  return readFileSync(sqlPath, 'utf8');
}

function assertDbUrl() {
  const fileEnv = {
    ...loadEnvFile(resolve(process.cwd(), '..', '.env.local')),
    ...loadEnvFile(resolve(process.cwd(), '.env.local')),
  };
  const url =
    process.env.CONSENT_SOVEREIGNTY_V11_DATABASE_URL ||
    process.env.DATABASE_URL ||
    fileEnv.DATABASE_URL ||
    process.env.TEST_DATABASE_URL ||
    fileEnv.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'Set DATABASE_URL in tracebud-backend/.env.local (or export it). Do not use placeholder text like <supabase-pooler-url>.',
    );
  }
  if (url.includes('<') || url.includes('YOUR_PROJECT') || url.includes('PASSWORD')) {
    throw new Error(
      'DATABASE_URL looks like an example placeholder. Paste the real Supabase pooler URL from Dashboard → Settings → Database.',
    );
  }
  return url;
}

async function run() {
  const verifyOnly = process.argv.includes('--verify-only');
  const connectionString = assertDbUrl();
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query('BEGIN');
    if (!verifyOnly) {
      for (const file of SQL_FILES) {
        await client.query(loadSql(file));
      }
    }
    const verify = await client.query(`
      SELECT
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'crm_contacts'
            AND column_name = 'farmer_profile_id'
        ) AS crm_farmer_profile_col,
        to_regclass('public.farmer_push_devices')::text AS push_devices_table,
        (
          SELECT relrowsecurity
          FROM pg_class
          WHERE oid = 'public.consent_grants'::regclass
        ) AS consent_grants_rls_enabled
    `);
    const row = verify.rows[0];
    if (!row?.crm_farmer_profile_col) {
      throw new Error('Verification failed: crm_contacts.farmer_profile_id column missing.');
    }
    if (!row?.push_devices_table) {
      throw new Error('Verification failed: farmer_push_devices table missing.');
    }
    if (!row?.consent_grants_rls_enabled) {
      throw new Error('Verification failed: consent_grants RLS not enabled.');
    }
    await client.query('COMMIT');
    console.log(
      verifyOnly
        ? 'Consent sovereignty v1.1 migration verified.'
        : 'Consent sovereignty v1.1 migration applied and verified.',
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

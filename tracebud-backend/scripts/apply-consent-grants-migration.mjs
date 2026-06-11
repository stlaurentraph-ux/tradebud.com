#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

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

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_033_consent_grants.sql');
  return readFileSync(sqlPath, 'utf8');
}

function assertDbUrl() {
  const fileEnv = {
    ...loadEnvFile(resolve(process.cwd(), '..', '.env.local')),
    ...loadEnvFile(resolve(process.cwd(), '.env.local')),
  };
  const url =
    process.env.CONSENT_GRANTS_DATABASE_URL ||
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
      await client.query(loadSql());
    }
    const verify = await client.query(`
      SELECT to_regclass('public.consent_grants')::text AS table_name
    `);
    if (!verify.rows[0]?.table_name) {
      throw new Error('Migration verification failed: consent_grants table not found.');
    }
    await client.query('COMMIT');
    console.log(verifyOnly ? 'Verified consent_grants migration.' : 'Applied and verified consent_grants migration.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});

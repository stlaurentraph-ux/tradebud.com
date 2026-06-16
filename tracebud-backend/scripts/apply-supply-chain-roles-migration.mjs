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

const repoRoot = resolve(import.meta.dirname, '../..');
const env = {
  ...loadEnvFile(resolve(repoRoot, 'tracebud-backend/.env')),
  ...loadEnvFile(resolve(repoRoot, '.env')),
  ...loadEnvFile(resolve(repoRoot, '.env.local')),
  ...process.env,
};

const databaseUrl = env.DATABASE_URL ?? env.SUPABASE_DB_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL or SUPABASE_DB_URL is required.');
  process.exit(1);
}

const sqlPath = resolve(import.meta.dirname, '../sql/tb_v16_045_tenant_supply_chain_roles.sql');
const sql = readFileSync(sqlPath, 'utf8');

const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  await client.query(sql);
  console.log('Applied tb_v16_045_tenant_supply_chain_roles.sql');
} finally {
  await client.end();
}

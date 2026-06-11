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
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_043_evidence_documents_phase2.sql');
  return readFileSync(sqlPath, 'utf8');
}

function assertDbUrl() {
  const fileEnv = {
    ...loadEnvFile(resolve(process.cwd(), '..', '.env.local')),
    ...loadEnvFile(resolve(process.cwd(), '.env.local')),
    ...loadEnvFile(resolve(process.cwd(), '.env')),
  };
  const url =
    process.env.DATABASE_URL || fileEnv.DATABASE_URL || process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('Set DATABASE_URL in tracebud-backend/.env.local or .env');
  }
  return url;
}

async function verify(client) {
  const res = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'evidence_documents'
    ) AS ok
  `);
  return res.rows[0]?.ok === true;
}

async function main() {
  const verifyOnly = process.argv.includes('--verify-only');
  const dbUrl = assertDbUrl();
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    if (verifyOnly) {
      const ok = await verify(client);
      if (!ok) {
        console.error('evidence_documents table is missing.');
        process.exit(1);
      }
      console.log('evidence_documents phase 2 migration verified.');
      return;
    }

    const sql = loadSql();
    await client.query(sql);
    const ok = await verify(client);
    if (!ok) {
      throw new Error('Migration ran but evidence_documents still missing.');
    }
    console.log('Applied evidence_documents phase 2 migration.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

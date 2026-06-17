#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

const SQL_FILE = 'tb_v16_047_processing_facility_subtypes.sql';

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

function assertDbUrl() {
  const fileEnv = {
    ...loadEnvFile(resolve(process.cwd(), '..', '.env.local')),
    ...loadEnvFile(resolve(process.cwd(), '.env.local')),
  };
  const url =
    process.env.PROCESSING_SUBTYPES_DATABASE_URL ||
    process.env.DATABASE_URL ||
    fileEnv.DATABASE_URL ||
    process.env.TEST_DATABASE_URL ||
    fileEnv.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('Set DATABASE_URL in tracebud-backend/.env.local (or export it).');
  }
  return url;
}

async function run() {
  const verifyOnly = process.argv.includes('--verify-only');
  const connectionString = assertDbUrl();
  const sql = readFileSync(resolve(process.cwd(), 'sql', SQL_FILE), 'utf8');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  await client.connect();
  try {
    if (!verifyOnly) {
      await client.query(sql);
      console.log(`Applied ${SQL_FILE}`);
    }
    const column = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'crm_contacts' AND column_name = 'processing_subtype'
    `);
    if (column.rows.length === 0) {
      throw new Error('Verification failed: crm_contacts.processing_subtype column missing.');
    }
    const verify = await client.query(`
      SELECT pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conname = 'crm_contacts_contact_type_check'
    `);
    const def = verify.rows[0]?.def ?? '';
    if (def.includes('washing_station')) {
      throw new Error(
        'Verification failed: washing_station should no longer be a top-level contact_type.',
      );
    }
    if (!def.includes('processing_facility')) {
      throw new Error('Verification failed: processing_facility missing from contact_type check.');
    }
    console.log('Verified processing facility subtype schema.');
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

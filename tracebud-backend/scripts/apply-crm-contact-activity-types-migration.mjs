#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

const SQL_FILE = 'tb_v16_041_crm_contact_activity_types.sql';

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
    process.env.CRM_ACTIVITY_TYPES_DATABASE_URL ||
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
    const verify = await client.query(`
      SELECT pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conname = 'crm_contacts_contact_type_check'
    `);
    const def = verify.rows[0]?.def ?? '';
    const required = ['processing_facility', 'trader'];
    const disallowed = ['washing_station'];
    const missing = required.filter((type) => !def.includes(type));
    const legacyTopLevel = disallowed.filter((type) => def.includes(`'${type}'`));
    if (missing.length > 0) {
      throw new Error(
        `Verification failed: crm_contacts_contact_type_check missing ${missing.join(', ')}.`,
      );
    }
    if (legacyTopLevel.length > 0) {
      throw new Error(
        `Verification failed: apply TB-V16-047 — ${legacyTopLevel.join(', ')} should not be top-level contact types.`,
      );
    }
    console.log('Verified CRM contact activity types constraint.');
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

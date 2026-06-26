#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

const SQL_FILE = 'tb_v16_041_crm_contact_activity_types.sql';

async function run() {
  const verifyOnly = process.argv.includes('--verify-only');
  const sql = readFileSync(resolve(process.cwd(), 'sql', SQL_FILE), 'utf8');

  await withMigrationClient(async (client) => {
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
  });
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

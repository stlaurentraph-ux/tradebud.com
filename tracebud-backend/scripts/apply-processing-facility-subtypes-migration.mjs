#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

const SQL_FILE = 'tb_v16_047_processing_facility_subtypes.sql';

async function run() {
  const verifyOnly = process.argv.includes('--verify-only');
  const sql = readFileSync(resolve(process.cwd(), 'sql', SQL_FILE), 'utf8');

  await withMigrationClient(async (client) => {
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
  });
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

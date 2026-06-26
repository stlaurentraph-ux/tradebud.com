#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

const SQL_FILES = [
  'tb_v16_040_crm_contacts_farmer_profile.sql',
  'tb_v16_041_consent_grants_rls.sql',
  'tb_v16_042_farmer_push_devices.sql',
];

function loadSql(name) {
  return readFileSync(resolve(process.cwd(), 'sql', name), 'utf8');
}

async function run() {
  const verifyOnly = process.argv.includes('--verify-only');

  await withMigrationClient(
    async (client) => {
      await client.query('BEGIN');
      try {
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
      }
    },
    { overrideEnvKeys: ['CONSENT_SOVEREIGNTY_V11_DATABASE_URL'] },
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

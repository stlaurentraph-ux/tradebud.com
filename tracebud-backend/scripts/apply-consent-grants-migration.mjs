#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_033_consent_grants.sql');
  return readFileSync(sqlPath, 'utf8');
}

async function main() {
  const verifyOnly = process.argv.includes('--verify-only');

  await withMigrationClient(
    async (client) => {
      await client.query('BEGIN');
      try {
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
        console.log(
          verifyOnly ? 'Verified consent_grants migration.' : 'Applied and verified consent_grants migration.',
        );
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    },
    { overrideEnvKeys: ['CONSENT_GRANTS_DATABASE_URL'] },
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

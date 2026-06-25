import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_024_crm_contacts.sql');
  return readFileSync(sqlPath, 'utf8');
}

async function run() {
  const verifyOnly = process.argv.includes('--verify-only');

  await withMigrationClient(
    async (client) => {
      await client.query('BEGIN');
      try {
        if (!verifyOnly) {
          await client.query(loadSql());
        }
        const verify = await client.query(`
          SELECT to_regclass('public.crm_contacts')::text AS table_name
        `);
        if (!verify.rows[0]?.table_name) {
          throw new Error('Migration verification failed: crm_contacts table not found.');
        }
        await client.query('COMMIT');
        console.log(
          verifyOnly ? 'Verified crm_contacts migration.' : 'Applied and verified crm_contacts migration.',
        );
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    },
    { overrideEnvKeys: ['CRM_CONTACTS_DATABASE_URL'] },
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

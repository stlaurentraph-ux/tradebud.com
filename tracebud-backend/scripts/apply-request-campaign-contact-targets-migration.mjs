import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_026_request_campaign_contact_targets.sql');
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
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'request_campaigns'
            AND column_name = 'target_contact_emails'
          LIMIT 1
        `);
        if (!verify.rows[0]?.column_name) {
          throw new Error(
            'Migration verification failed: request_campaigns.target_contact_emails column not found.',
          );
        }
        await client.query('COMMIT');
        console.log(
          verifyOnly
            ? 'Verified request campaigns contact targets migration.'
            : 'Applied and verified request campaigns contact targets migration.',
        );
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    },
    { overrideEnvKeys: ['REQUEST_CAMPAIGNS_DATABASE_URL'] },
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

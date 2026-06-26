import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_059_audit_client_event_idempotency.sql');
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
        const verify = await client.query(
          `
          SELECT indexname
          FROM pg_indexes
          WHERE indexname = 'idx_audit_log_user_event_client_event_id'
        `,
        );
        if (verify.rowCount === 0) {
          throw new Error('idx_audit_log_user_event_client_event_id was not created.');
        }
        await client.query('COMMIT');
        console.log('audit clientEventId idempotency index OK');
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      }
    },
    { overrideEnvKeys: ['AUDIT_IDEMPOTENCY_DATABASE_URL'] },
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

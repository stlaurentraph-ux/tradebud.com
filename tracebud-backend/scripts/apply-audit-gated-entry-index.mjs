import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_004_audit_gated_entry_index.sql');
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
          WHERE tablename = 'audit_log'
            AND indexname = 'idx_audit_log_gated_entry_tenant_gate_ts'
        `,
        );
        if (!verify.rows.length) {
          throw new Error('Index verification failed: idx_audit_log_gated_entry_tenant_gate_ts not found.');
        }
        await client.query('COMMIT');
        console.log(
          verifyOnly ? 'Verified audit gated-entry index.' : 'Applied and verified audit gated-entry index.',
        );
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    },
    { overrideEnvKeys: ['AUDIT_INDEX_DATABASE_URL'] },
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_004_audit_gated_entry_index.sql');
  return readFileSync(sqlPath, 'utf8');
}

function assertDbUrl() {
  const url =
    process.env.AUDIT_INDEX_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'AUDIT_INDEX_DATABASE_URL, DATABASE_URL, or TEST_DATABASE_URL is required to apply audit gated-entry index.',
    );
  }
  return url;
}

async function run() {
  const verifyOnly = process.argv.includes('--verify-only');
  const connectionString = assertDbUrl();
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query('BEGIN');
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
    if (verifyOnly) {
      console.log('Verified audit gated-entry index.');
    } else {
      console.log('Applied and verified audit gated-entry index.');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

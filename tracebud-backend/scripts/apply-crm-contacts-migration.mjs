import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_024_crm_contacts.sql');
  return readFileSync(sqlPath, 'utf8');
}

function assertDbUrl() {
  const url =
    process.env.CRM_CONTACTS_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'CRM_CONTACTS_DATABASE_URL, DATABASE_URL, or TEST_DATABASE_URL is required to apply crm contacts migration.',
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
        SELECT to_regclass('public.crm_contacts')::text AS table_name
      `,
    );
    if (!verify.rows[0]?.table_name) {
      throw new Error('Migration verification failed: crm_contacts table not found.');
    }
    await client.query('COMMIT');
    if (verifyOnly) {
      console.log('Verified crm_contacts migration.');
    } else {
      console.log('Applied and verified crm_contacts migration.');
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


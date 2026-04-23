import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_026_request_campaign_contact_targets.sql');
  return readFileSync(sqlPath, 'utf8');
}

function assertDbUrl() {
  const url =
    process.env.REQUEST_CAMPAIGNS_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'REQUEST_CAMPAIGNS_DATABASE_URL, DATABASE_URL, or TEST_DATABASE_URL is required to apply request campaigns contact targets migration.',
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
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'request_campaigns'
          AND column_name = 'target_contact_emails'
        LIMIT 1
      `,
    );
    if (!verify.rows[0]?.column_name) {
      throw new Error(
        'Migration verification failed: request_campaigns.target_contact_emails column not found.',
      );
    }
    await client.query('COMMIT');
    if (verifyOnly) {
      console.log('Verified request campaigns contact targets migration.');
    } else {
      console.log('Applied and verified request campaigns contact targets migration.');
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


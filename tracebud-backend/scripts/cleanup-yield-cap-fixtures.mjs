#!/usr/bin/env node

/**
 * Cleanup helper for local/QA yield-cap validation fixtures.
 *
 * Removes the known fake farmer fixture and related plot/harvest/voucher rows used
 * during end-to-end cap enforcement tests.
 */

import { readFileSync } from 'node:fs';
import { Pool } from 'pg';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const pool = new Pool({
  connectionString: (process.env.DATABASE_URL ?? env.DATABASE_URL ?? '').trim(),
});

const farmerId = '11111111-1111-4111-8111-111111111111';

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `
        DELETE FROM voucher
        WHERE farmer_id = $1::uuid
      `,
      [farmerId],
    );

    await client.query(
      `
        DELETE FROM harvest_transaction
        WHERE farmer_id = $1::uuid
      `,
      [farmerId],
    );

    await client.query(
      `
        DELETE FROM plot
        WHERE farmer_id = $1::uuid
      `,
      [farmerId],
    );

    await client.query(
      `
        DELETE FROM farmer_profile
        WHERE id = $1::uuid
      `,
      [farmerId],
    );

    await client.query('COMMIT');
    console.log(`Deleted fixture rows for farmer ${farmerId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

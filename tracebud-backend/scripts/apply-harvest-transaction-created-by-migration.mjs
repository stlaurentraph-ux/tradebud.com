#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

function loadSql() {
  return readFileSync(
    resolve(process.cwd(), 'sql', 'tb_v16_048_harvest_transaction_created_by.sql'),
    'utf8',
  );
}

async function verify(client) {
  const res = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'harvest_transaction'
        AND column_name = 'created_by'
    ) AS ok
  `);
  return res.rows[0]?.ok === true;
}

async function main() {
  const verifyOnly = process.argv.includes('--verify-only');

  await withMigrationClient(async (client) => {
    if (verifyOnly) {
      const ok = await verify(client);
      if (!ok) {
        console.error('harvest_transaction.created_by column is missing.');
        process.exit(1);
      }
      console.log('harvest_transaction.created_by migration verified.');
      return;
    }

    await client.query(loadSql());
    const ok = await verify(client);
    if (!ok) {
      throw new Error('Migration ran but harvest_transaction.created_by still missing.');
    }
    console.log('Applied harvest_transaction.created_by migration.');
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

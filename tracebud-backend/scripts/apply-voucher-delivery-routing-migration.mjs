#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { describeDatabaseUrl, resolveDatabaseUrl } from './db-url-from-env.mjs';

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_044_voucher_delivery_routing.sql');
  return readFileSync(sqlPath, 'utf8');
}

async function verify(client) {
  const res = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'voucher'
        AND column_name = 'intended_recipient_email'
    ) AS ok
  `);
  return res.rows[0]?.ok === true;
}

async function main() {
  const verifyOnly = process.argv.includes('--verify-only');
  const dbUrl = resolveDatabaseUrl();
  console.log(`Using DATABASE_URL host: ${describeDatabaseUrl(dbUrl)}`);
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    if (verifyOnly) {
      const ok = await verify(client);
      if (!ok) {
        console.error('voucher.intended_recipient_email column is missing.');
        process.exit(1);
      }
      console.log('voucher delivery routing migration verified.');
      return;
    }

    await client.query(loadSql());
    const ok = await verify(client);
    if (!ok) {
      throw new Error('Migration ran but voucher.intended_recipient_email still missing.');
    }
    console.log('Applied voucher delivery routing migration.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { describeDatabaseUrl, resolveDatabaseUrl } from './db-url-from-env.mjs';

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_054_voucher_buyer_invites.sql');
  return readFileSync(sqlPath, 'utf8');
}

async function verify(client) {
  const res = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'voucher_buyer_invites'
    ) AS ok
  `);
  return res.rows[0]?.ok === true;
}

async function main() {
  const verifyOnly = process.argv.includes('--verify-only');
  const dbUrl = resolveDatabaseUrl();
  console.log(`Using DATABASE_URL host: ${describeDatabaseUrl(dbUrl)}`);
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    if (verifyOnly) {
      const ok = await verify(client);
      if (!ok) {
        console.error('voucher_buyer_invites table is missing.');
        process.exit(1);
      }
      console.log('voucher buyer invites migration verified.');
      return;
    }

    await client.query(loadSql());
    const ok = await verify(client);
    if (!ok) {
      throw new Error('Migration ran but voucher_buyer_invites still missing.');
    }
    console.log('Applied voucher buyer invites migration.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

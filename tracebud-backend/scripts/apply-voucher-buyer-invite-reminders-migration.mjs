#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_055_voucher_buyer_invite_reminders.sql');
  return readFileSync(sqlPath, 'utf8');
}

async function verify(client) {
  const res = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'voucher_buyer_invites'
        AND column_name = 'reminder_nudge_count'
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
        console.error('voucher_buyer_invites.reminder_nudge_count column is missing.');
        process.exit(1);
      }
      console.log('voucher buyer invite reminders migration verified.');
      return;
    }

    await client.query(loadSql());
    const ok = await verify(client);
    if (!ok) {
      throw new Error('Migration ran but reminder_nudge_count column still missing.');
    }
    console.log('Applied voucher buyer invite reminders migration.');
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_062_campaign_recipient_farmer_claim.sql');
  return readFileSync(sqlPath, 'utf8');
}

async function verify(client) {
  const res = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'campaign_recipient_invites'
      AND column_name = 'claimed_farmer_profile_id'
    LIMIT 1
  `);
  return Boolean(res.rows[0]?.column_name);
}

async function main() {
  const verifyOnly = process.argv.includes('--verify-only');

  await withMigrationClient(async (client) => {
    if (verifyOnly) {
      const ok = await verify(client);
      if (!ok) {
        console.error('campaign_recipient_invites.claimed_farmer_profile_id column is missing.');
        process.exit(1);
      }
      console.log('Verified campaign recipient farmer claim migration.');
      return;
    }

    await client.query(loadSql());
    const ok = await verify(client);
    if (!ok) {
      throw new Error('Migration ran but claimed_farmer_profile_id column still missing.');
    }
    console.log('Applied campaign recipient farmer claim migration.');
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

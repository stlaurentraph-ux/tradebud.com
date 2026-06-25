#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_063_crm_farmer_phone_reachability.sql');
  return readFileSync(sqlPath, 'utf8');
}

async function verify(client) {
  const nullable = await client.query(`
    SELECT is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'crm'
      AND table_name = 'crm_contacts'
      AND column_name = 'email'
    LIMIT 1
  `);
  const constraint = await client.query(`
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'crm_contacts_farmer_reachability_check'
    LIMIT 1
  `);
  return nullable.rows[0]?.is_nullable === 'YES' && (constraint.rowCount ?? 0) > 0;
}

async function main() {
  const verifyOnly = process.argv.includes('--verify-only');

  await withMigrationClient(async (client) => {
    if (verifyOnly) {
      const ok = await verify(client);
      if (!ok) {
        console.error('crm.crm_contacts farmer phone reachability migration is incomplete.');
        process.exit(1);
      }
      console.log('Verified CRM farmer phone reachability migration.');
      return;
    }

    await client.query(loadSql());
    const ok = await verify(client);
    if (!ok) {
      throw new Error('Migration ran but CRM farmer reachability constraints still missing.');
    }
    console.log('Applied CRM farmer phone reachability migration.');
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

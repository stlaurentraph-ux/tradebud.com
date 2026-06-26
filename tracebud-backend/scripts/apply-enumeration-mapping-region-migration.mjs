#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

function loadSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_062_enumeration_mapping_region.sql');
  return readFileSync(sqlPath, 'utf8');
}

async function verify(client) {
  const res = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'ops'
      AND table_name = 'request_campaigns'
      AND column_name = 'mapping_region_label'
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
        console.error('ops.request_campaigns.mapping_region_label column is missing.');
        process.exit(1);
      }
      console.log('Verified enumeration mapping region migration.');
      return;
    }

    await client.query(loadSql());
    const ok = await verify(client);
    if (!ok) {
      throw new Error('Migration ran but mapping_region_label column still missing.');
    }
    console.log('Applied enumeration mapping region migration.');
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

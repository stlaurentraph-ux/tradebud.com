#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

const INDEX_NAME = 'idx_harvest_transaction_farmer_client_event_id';

function loadSql() {
  return readFileSync(
    resolve(process.cwd(), 'sql', 'tb_v16_071_harvest_client_event_unique.sql'),
    'utf8',
  );
}

async function indexExists(client) {
  const res = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM pg_indexes
       WHERE schemaname = 'public'
         AND indexname = $1
     ) AS ok`,
    [INDEX_NAME],
  );
  return res.rows[0]?.ok === true;
}

async function duplicateGroupCount(client) {
  const res = await client.query(`
    SELECT count(*)::int AS dup_groups
    FROM (
      SELECT farmer_id, client_event_id
      FROM harvest_transaction
      WHERE client_event_id IS NOT NULL
        AND btrim(client_event_id) <> ''
      GROUP BY farmer_id, client_event_id
      HAVING count(*) > 1
    ) d
  `);
  return res.rows[0]?.dup_groups ?? 0;
}

async function main() {
  const verifyOnly = process.argv.includes('--verify-only');

  await withMigrationClient(async (client) => {
    const dupsBefore = await duplicateGroupCount(client);

    if (verifyOnly) {
      const exists = await indexExists(client);
      console.log(
        `verify: index ${exists ? 'present' : 'absent'}, ${dupsBefore} duplicate (farmer_id, client_event_id) group(s).`,
      );
      if (!exists && dupsBefore === 0) {
        console.error('Index is absent even though no duplicates exist — run without --verify-only.');
        process.exit(1);
      }
      if (!exists && dupsBefore > 0) {
        console.error(
          `Index NOT enforced: ${dupsBefore} duplicate group(s) must be de-duplicated first.`,
        );
        process.exit(1);
      }
      console.log('harvest client_event_id unique index verified.');
      return;
    }

    if (dupsBefore > 0) {
      console.warn(
        `WARN ${dupsBefore} duplicate (farmer_id, client_event_id) harvest group(s) present; migration will log and skip index creation.`,
      );
    }

    await client.query(loadSql());

    const exists = await indexExists(client);
    if (exists) {
      console.log(`Applied: unique index ${INDEX_NAME} is present.`);
    } else {
      console.warn(
        `Index ${INDEX_NAME} was NOT created because ${dupsBefore} duplicate group(s) exist. De-duplicate, then re-run.`,
      );
    }
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

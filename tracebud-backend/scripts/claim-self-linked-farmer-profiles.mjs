#!/usr/bin/env node
/**
 * One-off repair: link offline farmer_profile rows (user_id = id) to auth users
 * when a user_account exists for the same farmer id (legacy bootstrap).
 *
 * Runtime fix: field-app-bootstrap now calls claimSelfLinkedFarmerProfileForAuthUser
 * on every sync. Run this script only if you need to bulk-repair before deploy.
 */
import { Client } from 'pg';
import { resolveDatabaseUrl } from './db-url-from-env.mjs';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const client = new Client({ connectionString: resolveDatabaseUrl() });
  await client.connect();
  try {
    const pending = await client.query(`
      SELECT fp.id::text AS farmer_id, fp.user_id::text AS user_id
      FROM farmer_profile fp
      WHERE fp.id = fp.user_id
    `);
    if ((pending.rowCount ?? 0) === 0) {
      console.log('No self-linked farmer_profile rows found.');
      return;
    }
    console.log(`Found ${pending.rowCount} self-linked farmer_profile row(s).`);
    if (dryRun) {
      for (const row of pending.rows) {
        console.log(`  would claim farmer_id=${row.farmer_id}`);
      }
      console.log('Dry run only — re-run without --dry-run after deploying bootstrap claim.');
      return;
    }
    console.log(
      'Nothing to bulk-update automatically (auth user id is not stored on self-linked rows).',
    );
    console.log('Deploy backend claim fix and tap Sync now in the app to link each profile.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

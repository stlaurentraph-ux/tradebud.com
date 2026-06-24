import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

const MIGRATIONS = [
  {
    file: 'tb_v16_063_crm_farmer_phone_reachability.sql',
    verifySql: `
      SELECT conname
      FROM pg_constraint
      WHERE conname = 'crm_contacts_farmer_reachability_check'
      LIMIT 1
    `,
    verifyLabel: 'crm_contacts_farmer_reachability_check',
  },
  {
    file: 'tb_v16_065_campaign_invite_claim_tokens.sql',
    verifySql: `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'campaign_recipient_invites'
        AND column_name = 'claim_token_hash'
      LIMIT 1
    `,
    verifyLabel: 'campaign_recipient_invites.claim_token_hash',
  },
  {
    file: 'tb_v16_066_campaign_fulfillment_provenance.sql',
    verifySql: `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'ops'
        AND table_name = 'request_campaign_recipient_decisions'
        AND column_name = 'fulfillment_source'
      LIMIT 1
    `,
    verifyLabel: 'request_campaign_recipient_decisions.fulfillment_source',
  },
  {
    file: 'tb_v16_067_campaign_delivery_attempts.sql',
    verifySql: `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'campaign_delivery_attempts'
      LIMIT 1
    `,
    verifyLabel: 'campaign_delivery_attempts',
  },
];

function loadSql(filename) {
  return readFileSync(resolve(process.cwd(), 'sql', filename), 'utf8');
}

async function run() {
  const verifyOnly = process.argv.includes('--verify-only');

  await withMigrationClient(async (client) => {
    for (const migration of MIGRATIONS) {
      const verify = await client.query(migration.verifySql);
      const alreadyApplied = Boolean(verify.rows[0]);
      if (alreadyApplied) {
        console.log(`Already applied: ${migration.verifyLabel}`);
        continue;
      }
      if (verifyOnly) {
        throw new Error(`Missing migration artifact: ${migration.verifyLabel}`);
      }
      await client.query('BEGIN');
      try {
        await client.query(loadSql(migration.file));
        const recheck = await client.query(migration.verifySql);
        if (!recheck.rows[0]) {
          throw new Error(`Verification failed after applying ${migration.file}`);
        }
        await client.query('COMMIT');
        console.log(`Applied: ${migration.file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  });
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Ops: supersede stale land-title verification rows for a plot.
 * Keeps newest stable path (…/land_title/title-*) as canonical.
 *
 * Usage:
 *   node scripts/supersede-duplicate-land-title-verifications.mjs <plot-id> [--dry-run]
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = stripQuotes(trimmed.slice(eq + 1).trim());
    if (value) out[key] = value;
  }
  return out;
}

function loadEnv() {
  const merged = {
    ...loadEnvFile(resolve(process.cwd(), '.env')),
    ...loadEnvFile(resolve(process.cwd(), '.env.local')),
    ...process.env,
  };
  for (const [key, value] of Object.entries(merged)) {
    if (typeof value === 'string' && value.trim()) process.env[key] = value.trim();
  }
}

const plotId = process.argv[2];
const dryRun = process.argv.includes('--dry-run');

if (!plotId || plotId.startsWith('--')) {
  console.error('Usage: node scripts/supersede-duplicate-land-title-verifications.mjs <plot-id> [--dry-run]');
  process.exit(1);
}

loadEnv();

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error('DATABASE_URL is required (.env.local)');
  process.exit(1);
}

const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();

  const { rows: active } = await client.query(
    `
      SELECT id::text, storage_path, parse_status
      FROM plot_tenure_verification
      WHERE plot_id = $1::uuid
        AND NOT COALESCE((parse_result->>'superseded')::boolean, false)
        AND (
          storage_path LIKE '%/land_title/%'
          OR evidence_label = 'land_title_photo'
        )
      ORDER BY updated_at DESC
    `,
    [plotId],
  );

  if (active.length === 0) {
    console.log(`No active land-title verifications for plot ${plotId}`);
    process.exit(0);
  }

  const canonical =
    active.find((row) => /\/land_title\/title-[^/]+$/.test(row.storage_path)) ?? active[0];

  const stale = active.filter((row) => row.id !== canonical.id);
  if (stale.length === 0) {
    console.log(`Plot ${plotId}: single active row (${canonical.storage_path}) — nothing to supersede`);
    process.exit(0);
  }

  console.log(`Plot ${plotId}: canonical ${canonical.storage_path}`);
  console.log(`Stale rows to supersede: ${stale.length}`);
  for (const row of stale) {
    console.log(`  - ${row.id} ${row.storage_path}`);
  }

  if (dryRun) {
    console.log('Dry run — no changes applied');
    process.exit(0);
  }

  await client.query('BEGIN');

  for (const row of stale) {
    await client.query(
      `
        UPDATE plot_tenure_verification
        SET
          parse_result = COALESCE(parse_result, '{}'::jsonb) || jsonb_build_object(
            'superseded', true,
            'superseded_at', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
            'superseded_by_storage_path', $2,
            'superseded_reason', 'ops_script_supersede_duplicate_land_title'
          ),
          updated_at = NOW()
        WHERE id = $1::uuid
      `,
      [row.id, canonical.storage_path],
    );
  }

  await client.query(
    `
      UPDATE compliance_issues
      SET status = 'resolved', updated_at = NOW()
      WHERE linked_entity_type = 'tenure_verification'
        AND status = 'open'
        AND linked_entity_id = ANY($1::text[])
    `,
    [stale.map((row) => row.id)],
  );

  await client.query('COMMIT');

  const { rows: after } = await client.query(
    `
      SELECT COUNT(*)::int AS active
      FROM plot_tenure_verification
      WHERE plot_id = $1::uuid
        AND NOT COALESCE((parse_result->>'superseded')::boolean, false)
    `,
    [plotId],
  );

  console.log(`Done. Active verification rows: ${after[0]?.active ?? '?'}`);
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error(error);
  process.exit(1);
} finally {
  await client.end();
}

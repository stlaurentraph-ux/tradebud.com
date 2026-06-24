#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

const verifyOnly = process.argv.includes('--verify-only');
const sql = readFileSync(resolve(import.meta.dirname, '../sql/tb_v16_063_plot_geometry_approval.sql'), 'utf8');

await withMigrationClient(async (client) => {
  if (verifyOnly) {
    const plotCol = await client.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'plot'
        AND column_name = 'geometry_approved_at'
    `);
    if (plotCol.rowCount === 0) {
      console.error('Missing plot.geometry_approved_at column.');
      process.exit(1);
    }
    const policyTable = await client.query(`
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'tenant_geometry_policy'
    `);
    if (policyTable.rowCount === 0) {
      console.error('Missing tenant_geometry_policy table.');
      process.exit(1);
    }
    console.log('Verified plot geometry approval schema.');
    return;
  }

  await client.query(sql);
  console.log('Applied tb_v16_063_plot_geometry_approval.sql');
});

#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

const verifyOnly = process.argv.includes('--verify-only');
const sql = readFileSync(resolve(import.meta.dirname, '../sql/tb_v16_046_plot_geometry_capture.sql'), 'utf8');

await withMigrationClient(async (client) => {
  if (verifyOnly) {
    const res = await client.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'plot'
        AND column_name = 'geometry_capture'
    `);
    if (res.rowCount === 0) {
      console.error('Missing plot.geometry_capture column.');
      process.exit(1);
    }
    console.log('Verified plot.geometry_capture column exists.');
    return;
  }

  await client.query(sql);
  console.log('Applied tb_v16_046_plot_geometry_capture.sql');
});

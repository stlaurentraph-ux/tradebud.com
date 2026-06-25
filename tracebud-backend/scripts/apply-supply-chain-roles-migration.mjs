#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

const sql = readFileSync(resolve(import.meta.dirname, '../sql/tb_v16_045_tenant_supply_chain_roles.sql'), 'utf8');

await withMigrationClient(async (client) => {
  await client.query(sql);
  console.log('Applied tb_v16_045_tenant_supply_chain_roles.sql');
});

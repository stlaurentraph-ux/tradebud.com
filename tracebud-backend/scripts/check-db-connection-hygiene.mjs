#!/usr/bin/env node
/**
 * Validates prod vs test database URL split.
 */
import { Client } from 'pg';
import {
  describeDatabaseSplit,
  describeDatabaseUrl,
  resolveDatabaseUrl,
  resolvePgPoolMaxFromEnv,
  resolveTestDatabaseUrl,
  validateDatabaseEnvSplit,
} from './db-url-from-env.mjs';

async function probeConnection(url, applicationName) {
  const client = new Client({
    connectionString: url,
    ssl: url.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 12_000,
    application_name: applicationName,
  });
  try {
    await client.connect();
    await client.query('SELECT 1');
    return 'ok';
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/password authentication failed/i.test(msg)) return 'auth_failed';
    if (/remaining connection slots/i.test(msg)) return 'slots_full';
    if (/EHOSTUNREACH|ENETUNREACH|No route to host/i.test(msg)) return 'network_unreachable';
    return 'error';
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}

async function main() {
  let failed = false;
  const warn = (msg) => console.warn(`WARN ${msg}`);
  const ok = (msg) => console.log(`OK   ${msg}`);
  const fail = (msg) => {
    console.error(`FAIL ${msg}`);
    failed = true;
  };

  const { split, issues } = validateDatabaseEnvSplit();
  for (const issue of issues) {
    fail(issue);
  }

  if (split.prod) {
    ok(`DATABASE_URL (prod): ${split.prod.host} [${split.prod.projectRef ?? 'unknown'}]`);
  }
  if (split.test) {
    ok(`TEST_DATABASE_URL (test): ${split.test.host} [${split.test.projectRef ?? 'unknown'}]`);
  }
  if (split.prod && split.test && !split.sameUrl) {
    ok('Prod and test URLs are separate');
  }

  ok(`PG_POOL_MAX (Railway / local API): ${resolvePgPoolMaxFromEnv()}`);

  let prodUrl;
  let testUrl;
  try {
    prodUrl = resolveDatabaseUrl();
    const prodProbe = await probeConnection(prodUrl, 'tracebud_check_prod_db');
    if (prodProbe === 'ok') ok('Prod DATABASE_URL connection probe succeeded');
    else if (prodProbe === 'slots_full') warn('Prod DB: connection slots full — retry later');
    else warn(`Prod DB probe: ${prodProbe}`);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  try {
    testUrl = resolveTestDatabaseUrl();
    const testProbe = await probeConnection(testUrl, 'tracebud_check_test_db');
    if (testProbe === 'ok') ok('TEST_DATABASE_URL connection probe succeeded');
    else if (testProbe === 'slots_full') warn('Test DB: connection slots full — retry later');
    else warn(`Test DB probe: ${testProbe}`);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  if (failed) {
    process.exit(1);
  }

  console.log('\nUsage:');
  console.log('  DATABASE_URL       → prod migrations, manual prod tooling');
  console.log('  TEST_DATABASE_URL  → npm run test:integration only');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

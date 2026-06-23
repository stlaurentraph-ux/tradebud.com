#!/usr/bin/env node
import { Client } from 'pg';
import {
  assertNotPlaceholderDatabaseUrl,
  assertProdDatabaseUrl,
  describeDatabaseUrl,
  resolveDatabaseUrl,
  warnIfDirectDatabaseUrl,
} from './db-url-from-env.mjs';

export function resolveMigrationDatabaseUrl(options = {}) {
  const overrideEnvKeys = options.overrideEnvKeys ?? [];
  for (const key of overrideEnvKeys) {
    const value = process.env[key]?.trim();
    if (value) {
      assertNotPlaceholderDatabaseUrl(value);
      warnIfDirectDatabaseUrl(value);
      return value;
    }
  }

  const url = resolveDatabaseUrl(options);
  assertNotPlaceholderDatabaseUrl(url);
  assertProdDatabaseUrl(url, 'migration DATABASE_URL');
  warnIfDirectDatabaseUrl(url);
  return url;
}

export async function withMigrationClient(run, options = {}) {
  const connectionString = resolveMigrationDatabaseUrl(options);
  console.log(`Using DATABASE_URL host: ${describeDatabaseUrl(connectionString)}`);

  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  const client = new Client({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
    application_name: options.applicationName ?? 'tracebud_migration_script',
  });

  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

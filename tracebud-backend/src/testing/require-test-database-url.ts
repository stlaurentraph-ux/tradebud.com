import { assertTestDatabaseUrl } from '../db/supabase-db-refs';

const INTEGRATION_TEST_HINT =
  'Use npm run test:integration (loads TEST_DATABASE_URL from repo root). Tip: npm run db:sync:test-env';

/** Integration suites — fail fast when jest is invoked without the test DB wrapper. */
export function requireTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL?.trim();
  if (!url) {
    throw new Error(`TEST_DATABASE_URL is not set. ${INTEGRATION_TEST_HINT}`);
  }
  assertTestDatabaseUrl(url);
  return url;
}

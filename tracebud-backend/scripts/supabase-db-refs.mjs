/** Keep in sync with src/db/supabase-db-refs.ts */
export const PROD_PROJECT_REF = 'uzsktajlnofosxeqwdwl';
export const TEST_PROJECT_REF = 'atisrfxsjjvjekwqcbjk';

export function getDatabaseProjectRef(url) {
  try {
    const user = new URL(url).username;
    if (user.startsWith('postgres.')) {
      return user.slice('postgres.'.length);
    }
    return null;
  } catch {
    return null;
  }
}

export function assertProdDatabaseUrl(url, context = 'DATABASE_URL') {
  const ref = getDatabaseProjectRef(url);
  if (ref === TEST_PROJECT_REF) {
    throw new Error(
      `${context} points at Supabase Test (${TEST_PROJECT_REF}). Use Tracebud prod (${PROD_PROJECT_REF}) for migrations and API.`,
    );
  }
}

export function assertTestDatabaseUrl(url, context = 'TEST_DATABASE_URL') {
  const ref = getDatabaseProjectRef(url);
  if (ref === PROD_PROJECT_REF) {
    throw new Error(
      `${context} points at Tracebud prod (${PROD_PROJECT_REF}). Integration tests must use Test (${TEST_PROJECT_REF}).`,
    );
  }
  if (ref && ref !== TEST_PROJECT_REF) {
    throw new Error(
      `${context} project ref is ${ref}; expected Test project ${TEST_PROJECT_REF}.`,
    );
  }
}

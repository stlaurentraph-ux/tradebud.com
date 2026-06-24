/** Keep in sync with scripts/supabase-db-refs.mjs */
export const PROD_PROJECT_REF = 'uzsktajlnofosxeqwdwl';
export const TEST_PROJECT_REF = 'atisrfxsjjvjekwqcbjk';

export function getSupabaseProjectRef(connectionString: string): string | null {
  try {
    const user = new URL(connectionString).username;
    if (user.startsWith('postgres.')) {
      return user.slice('postgres.'.length);
    }
    return null;
  } catch {
    return null;
  }
}

export function assertProdDatabaseUrl(connectionString: string, context = 'DATABASE_URL'): void {
  const ref = getSupabaseProjectRef(connectionString);
  if (ref === TEST_PROJECT_REF) {
    throw new Error(
      `${context} points at Supabase Test (${TEST_PROJECT_REF}). Use Tracebud prod (${PROD_PROJECT_REF}) for the API and migrations.`,
    );
  }
}

export function assertTestDatabaseUrl(connectionString: string, context = 'TEST_DATABASE_URL'): void {
  const ref = getSupabaseProjectRef(connectionString);
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

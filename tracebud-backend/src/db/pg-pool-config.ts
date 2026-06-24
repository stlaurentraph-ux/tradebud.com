import {
  PROD_PROJECT_REF,
  TEST_PROJECT_REF,
  getSupabaseProjectRef,
} from './supabase-db-refs';

/** Default pg pool size per API process — keep low on Supabase shared Postgres. */
export const PG_POOL_DEFAULT_MAX = 5;

/** Safety cap so misconfigured env cannot exhaust Supabase connection slots. */
export const PG_POOL_HARD_CAP = 20;

export function resolvePgPoolMax(): number {
  const raw = process.env.PG_POOL_MAX;
  if (raw == null || raw.trim() === '') {
    return PG_POOL_DEFAULT_MAX;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return PG_POOL_DEFAULT_MAX;
  }
  return Math.min(Math.floor(parsed), PG_POOL_HARD_CAP);
}

export function isSupabasePoolerUrl(connectionString: string): boolean {
  try {
    return new URL(connectionString).hostname.includes('pooler.supabase.com');
  } catch {
    return false;
  }
}

export function isSupabaseDirectUrl(connectionString: string): boolean {
  try {
    const host = new URL(connectionString).hostname;
    return host.startsWith('db.') && host.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

export function buildPgPoolConfig(connectionString: string) {
  const trimmed = connectionString.trim();
  const isLocal =
    trimmed.includes('localhost') ||
    trimmed.includes('127.0.0.1') ||
    trimmed.includes('@host.docker.internal');

  return {
    connectionString: trimmed,
    ssl: isLocal
      ? false
      : {
          rejectUnauthorized: false,
        },
    max: resolvePgPoolMax(),
    min: 0,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    maxUses: 7_500,
    keepAlive: true,
    application_name: process.env.PG_APPLICATION_NAME?.trim() || 'tracebud_api',
    options: '-c search_path=public,extensions,integrations,commercial,internal,ops,crm,gtm',
  };
}

export function collectDatabaseUrlWarnings(connectionString: string | undefined): string[] {
  const warnings: string[] = [];
  const url = connectionString?.trim();
  if (!url) {
    return warnings;
  }

  const projectRef = getSupabaseProjectRef(url);
  if (process.env.NODE_ENV === 'production') {
    if (projectRef === TEST_PROJECT_REF) {
      warnings.push(
        `DATABASE_URL points at Supabase Test (${TEST_PROJECT_REF}); production requires Tracebud prod (${PROD_PROJECT_REF}).`,
      );
    } else if (projectRef && projectRef !== PROD_PROJECT_REF) {
      warnings.push(
        `DATABASE_URL project ref ${projectRef} is not Tracebud prod (${PROD_PROJECT_REF}).`,
      );
    }
  } else if (projectRef === TEST_PROJECT_REF) {
    warnings.push(
      'DATABASE_URL points at Supabase Test — fine for integration work, but local API dev usually expects prod.',
    );
  }

  if (process.env.NODE_ENV === 'production' && isSupabaseDirectUrl(url)) {
    warnings.push(
      'DATABASE_URL uses direct db.*.supabase.co; prefer Supabase pooler (port 6543) in production.',
    );
  }

  const poolMax = resolvePgPoolMax();
  if (poolMax > 10) {
    warnings.push(
      `PG_POOL_MAX=${poolMax} is high for Supabase; use 3–8 per API replica unless load-tested.`,
    );
  }

  if (process.env.NODE_ENV === 'production' && !isSupabasePoolerUrl(url) && !isSupabaseDirectUrl(url)) {
    // Custom/self-hosted Postgres — no warning.
  } else if (process.env.NODE_ENV === 'production' && !isSupabasePoolerUrl(url) && isSupabaseDirectUrl(url)) {
    // covered above
  }

  return warnings;
}

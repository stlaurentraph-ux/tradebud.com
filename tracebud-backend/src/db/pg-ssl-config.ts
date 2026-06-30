import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { ConnectionOptions } from 'tls';

function isLocalDatabaseUrl(connectionString: string): boolean {
  return /(?:localhost|127\.0\.0\.1)/i.test(connectionString);
}

export function isSupabaseDatabaseUrl(connectionString: string): boolean {
  return /supabase\.(com|co)/i.test(connectionString);
}

function isAwsRdsDatabaseUrl(connectionString: string): boolean {
  return /\.rds\.amazonaws\.com/i.test(connectionString);
}

function resolvePgCaPem(): string | undefined {
  const fromEnv = process.env.DATABASE_SSL_CA?.trim();
  if (fromEnv) {
    if (fromEnv.includes('-----BEGIN CERTIFICATE-----')) {
      return fromEnv;
    }
    if (existsSync(fromEnv)) {
      return readFileSync(fromEnv, 'utf8');
    }
    throw new Error(`DATABASE_SSL_CA path does not exist: ${fromEnv}`);
  }

  const bundledPath = path.resolve(__dirname, '../../certs/rds-global-bundle.pem');
  if (existsSync(bundledPath)) {
    return readFileSync(bundledPath, 'utf8');
  }

  return undefined;
}

/**
 * Supabase pooler URLs need libpq-compatible SSL params; node-pg verifies with ssl:true.
 * See pg-connection-string warning and RAILWAY_QUICKSTART.md.
 */
export function normalizeDatabaseConnectionString(connectionString: string): string {
  if (!isSupabaseDatabaseUrl(connectionString)) {
    return connectionString;
  }
  const url = new URL(connectionString);
  if (!url.searchParams.has('uselibpqcompat')) {
    url.searchParams.set('uselibpqcompat', 'true');
  }
  if (!url.searchParams.get('sslmode')) {
    url.searchParams.set('sslmode', 'require');
  }
  return url.toString();
}

/** TLS options for pg Pool against Supabase/RDS (audit H4). */
export function resolvePgSslConfig(connectionString: string): boolean | ConnectionOptions {
  if (isLocalDatabaseUrl(connectionString)) {
    return false;
  }

  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === '0') {
    return { rejectUnauthorized: false };
  }

  const verify = process.env.NODE_ENV === 'production';

  if (isSupabaseDatabaseUrl(connectionString)) {
    return true;
  }

  const ca = resolvePgCaPem();

  if (verify && isAwsRdsDatabaseUrl(connectionString) && !ca) {
    throw new Error(
      'Production RDS DATABASE_URL requires TLS verification. Provide certs/rds-global-bundle.pem or DATABASE_SSL_CA.',
    );
  }

  if (verify && !ca) {
    return { rejectUnauthorized: true };
  }

  return {
    rejectUnauthorized: verify,
    ...(ca ? { ca } : {}),
  };
}

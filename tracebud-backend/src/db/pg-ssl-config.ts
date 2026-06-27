import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { ConnectionOptions } from 'tls';

function isLocalDatabaseUrl(connectionString: string): boolean {
  return /(?:localhost|127\.0\.0\.1)/i.test(connectionString);
}

function isSupabaseDatabaseUrl(connectionString: string): boolean {
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

/** TLS options for pg Pool against Supabase/RDS (audit H4). */
export function resolvePgSslConfig(connectionString: string): boolean | ConnectionOptions {
  if (isLocalDatabaseUrl(connectionString)) {
    return false;
  }

  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === '0') {
    return { rejectUnauthorized: false };
  }

  const verify = process.env.NODE_ENV === 'production';

  // Supabase uses public CAs — verify with the OS trust store, not the RDS bundle.
  if (isSupabaseDatabaseUrl(connectionString)) {
    return { rejectUnauthorized: verify };
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

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { ConnectionOptions } from 'tls';

function isLocalDatabaseUrl(connectionString: string): boolean {
  return /(?:localhost|127\.0\.0\.1)/i.test(connectionString);
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

  const ca = resolvePgCaPem();
  const verify = process.env.NODE_ENV === 'production';

  if (verify && !ca) {
    throw new Error(
      'Production DATABASE_URL requires TLS verification. Provide certs/rds-global-bundle.pem or DATABASE_SSL_CA.',
    );
  }

  return {
    rejectUnauthorized: verify,
    ...(ca ? { ca } : {}),
  };
}

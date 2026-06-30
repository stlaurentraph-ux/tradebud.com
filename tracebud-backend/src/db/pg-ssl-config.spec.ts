import { normalizeDatabaseConnectionString, resolvePgSslConfig } from './pg-ssl-config';

describe('resolvePgSslConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DATABASE_SSL_CA;
    delete process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('disables ssl for localhost', () => {
    expect(resolvePgSslConfig('postgresql://postgres:pw@localhost:5432/postgres')).toBe(false);
  });

  it('allows explicit insecure override for remote hosts', () => {
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = '0';
    expect(resolvePgSslConfig('postgresql://postgres:pw@db.example.com:5432/postgres')).toEqual({
      rejectUnauthorized: false,
    });
  });

  it('enables pg libpq SSL for Supabase pooler hosts', () => {
    process.env.NODE_ENV = 'production';
    expect(
      resolvePgSslConfig('postgresql://postgres:pw@aws-0-eu.pooler.supabase.com:6543/postgres?pgbouncer=true'),
    ).toBe(true);
  });

  it('verifies remote RDS TLS in production with bundled RDS CA', () => {
    process.env.NODE_ENV = 'production';
    const ssl = resolvePgSslConfig(
      'postgresql://postgres:pw@tracebud.abc123.us-east-1.rds.amazonaws.com:5432/postgres',
    );
    expect(ssl).toEqual(
      expect.objectContaining({
        rejectUnauthorized: true,
        ca: expect.stringContaining('-----BEGIN CERTIFICATE-----'),
      }),
    );
  });

  it('does not require verification outside production when CA is present for RDS', () => {
    const ssl = resolvePgSslConfig(
      'postgresql://postgres:pw@tracebud.abc123.us-east-1.rds.amazonaws.com:5432/postgres',
    );
    expect(ssl).toEqual(
      expect.objectContaining({
        rejectUnauthorized: false,
        ca: expect.stringContaining('-----BEGIN CERTIFICATE-----'),
      }),
    );
  });
});

describe('normalizeDatabaseConnectionString', () => {
  it('adds libpq SSL params for Supabase pooler URLs', () => {
    const normalized = normalizeDatabaseConnectionString(
      'postgresql://postgres:pw@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    );
    expect(normalized).toContain('uselibpqcompat=true');
    expect(normalized).toContain('sslmode=require');
    expect(normalized).toContain('pgbouncer=true');
  });

  it('leaves non-Supabase URLs unchanged', () => {
    const url = 'postgresql://postgres:pw@tracebud.abc123.us-east-1.rds.amazonaws.com:5432/postgres';
    expect(normalizeDatabaseConnectionString(url)).toBe(url);
  });
});

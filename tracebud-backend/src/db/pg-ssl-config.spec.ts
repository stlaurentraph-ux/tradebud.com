import { resolvePgSslConfig } from './pg-ssl-config';

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

  it('verifies remote TLS in production with bundled RDS CA', () => {
    process.env.NODE_ENV = 'production';
    const ssl = resolvePgSslConfig('postgresql://postgres:pw@aws-0-eu.pooler.supabase.com:6543/postgres');
    expect(ssl).toEqual(
      expect.objectContaining({
        rejectUnauthorized: true,
        ca: expect.stringContaining('-----BEGIN CERTIFICATE-----'),
      }),
    );
  });

  it('does not require verification outside production when CA is present', () => {
    const ssl = resolvePgSslConfig('postgresql://postgres:pw@aws-0-eu.pooler.supabase.com:6543/postgres');
    expect(ssl).toEqual(
      expect.objectContaining({
        rejectUnauthorized: false,
        ca: expect.stringContaining('-----BEGIN CERTIFICATE-----'),
      }),
    );
  });
});

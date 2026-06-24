import {
  PG_POOL_DEFAULT_MAX,
  PG_POOL_HARD_CAP,
  buildPgPoolConfig,
  collectDatabaseUrlWarnings,
  resolvePgPoolMax,
} from './pg-pool-config';

describe('pg-pool-config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PG_POOL_MAX;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('defaults pool max to 5', () => {
    expect(resolvePgPoolMax()).toBe(PG_POOL_DEFAULT_MAX);
  });

  it('caps pool max at hard limit', () => {
    process.env.PG_POOL_MAX = '999';
    expect(resolvePgPoolMax()).toBe(PG_POOL_HARD_CAP);
  });

  it('builds pool config with min 0 for scale-down', () => {
    const config = buildPgPoolConfig(
      'postgresql://postgres.ref:pw@aws-1-eu-central-1.pooler.supabase.com:6543/postgres',
    );
    expect(config.max).toBe(5);
    expect(config.min).toBe(0);
    expect(config.application_name).toBe('tracebud_api');
  });

  it('warns on direct supabase url in production', () => {
    process.env.NODE_ENV = 'production';
    const warnings = collectDatabaseUrlWarnings(
      'postgresql://postgres:pw@db.project.supabase.co:6543/postgres',
    );
    expect(warnings.some((w) => w.includes('pooler'))).toBe(true);
  });

  it('warns when prod API uses test supabase project', () => {
    process.env.NODE_ENV = 'production';
    const warnings = collectDatabaseUrlWarnings(
      'postgresql://postgres.atisrfxsjjvjekwqcbjk:pw@aws-1-eu-west-2.pooler.supabase.com:6543/postgres',
    );
    expect(warnings.some((w) => w.includes('Supabase Test'))).toBe(true);
  });
});

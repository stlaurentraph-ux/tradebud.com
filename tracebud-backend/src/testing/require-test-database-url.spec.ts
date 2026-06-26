import { requireTestDatabaseUrl } from './require-test-database-url';

describe('requireTestDatabaseUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.TEST_DATABASE_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws with integration hint when unset', () => {
    expect(() => requireTestDatabaseUrl()).toThrow(/npm run test:integration/);
  });

  it('rejects prod project ref', () => {
    process.env.TEST_DATABASE_URL =
      'postgresql://postgres.uzsktajlnofosxeqwdwl:pw@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';
    expect(() => requireTestDatabaseUrl()).toThrow(/Tracebud prod/);
  });

  it('returns test project url', () => {
    process.env.TEST_DATABASE_URL =
      'postgresql://postgres.atisrfxsjjvjekwqcbjk:pw@aws-1-eu-west-2.pooler.supabase.com:6543/postgres';
    expect(requireTestDatabaseUrl()).toBe(process.env.TEST_DATABASE_URL);
  });
});

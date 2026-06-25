import { assertProdDatabaseUrl } from './supabase-db-refs';

describe('supabase-db-refs', () => {
  it('blocks test project on prod DATABASE_URL', () => {
    expect(() =>
      assertProdDatabaseUrl(
        'postgresql://postgres.atisrfxsjjvjekwqcbjk:pw@aws-1-eu-west-2.pooler.supabase.com:6543/postgres',
      ),
    ).toThrow(/Supabase Test/);
  });
});

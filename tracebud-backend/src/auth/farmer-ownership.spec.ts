import { isFarmerProfileOwnedByUser } from './farmer-ownership';

describe('isFarmerProfileOwnedByUser', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const farmerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  it('returns true when farmer_profile matches id and user_id', async () => {
    const pool = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('WHERE id = $1')) return { rowCount: 1, rows: [{}] };
        return { rowCount: 0, rows: [] };
      }),
    } as never;

    await expect(isFarmerProfileOwnedByUser(pool, farmerId, userId)).resolves.toBe(true);
  });

  it('allows first-time field-app sync when farmerId equals auth uid and no profile exists', async () => {
    const pool = {
      query: jest.fn(async () => ({ rowCount: 0, rows: [] })),
    } as never;

    await expect(isFarmerProfileOwnedByUser(pool, userId, userId)).resolves.toBe(true);
  });

  it('rejects foreign farmer id without profile link', async () => {
    const pool = {
      query: jest.fn(async () => ({ rowCount: 0, rows: [] })),
    } as never;

    await expect(isFarmerProfileOwnedByUser(pool, farmerId, userId)).resolves.toBe(false);
  });
});

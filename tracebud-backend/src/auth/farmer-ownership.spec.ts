import {
  claimSelfLinkedFarmerProfileForAuthUser,
  isFarmerProfileOwnedByUser,
} from './farmer-ownership';

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

describe('claimSelfLinkedFarmerProfileForAuthUser', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const farmerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  it('claims self-linked offline farmer profiles for the auth user', async () => {
    const pool = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('SELECT user_id')) {
          return { rowCount: 1, rows: [{ user_id: farmerId }] };
        }
        if (sql.includes('UPDATE farmer_profile')) {
          return { rowCount: 1, rows: [] };
        }
        return { rowCount: 0, rows: [] };
      }),
    } as never;

    await expect(
      claimSelfLinkedFarmerProfileForAuthUser(pool, farmerId, userId),
    ).resolves.toBe(true);
  });

  it('does not claim profiles already linked to another user', async () => {
    const pool = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('SELECT user_id')) {
          return { rowCount: 1, rows: [{ user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }] };
        }
        return { rowCount: 0, rows: [] };
      }),
    } as never;

    await expect(
      claimSelfLinkedFarmerProfileForAuthUser(pool, farmerId, userId),
    ).resolves.toBe(false);
  });
});

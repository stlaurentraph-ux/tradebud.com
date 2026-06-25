import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchVouchersForFarmer: vi.fn(),
  getAccessTokenFromSupabaseWithTimeout: vi.fn(),
  getTracebudApiBaseUrl: vi.fn(),
}));

vi.mock('@/features/api/postPlot', () => ({
  fetchVouchersForFarmer: mocks.fetchVouchersForFarmer,
}));

vi.mock('@/features/api/syncAuthSession', () => ({
  getAccessTokenFromSupabaseWithTimeout: mocks.getAccessTokenFromSupabaseWithTimeout,
  getTracebudApiBaseUrl: mocks.getTracebudApiBaseUrl,
  getAuthenticatedSupabaseClient: vi.fn(async () => null),
}));

vi.mock('@/features/harvest/supplementVoucherHarvestDates', () => ({
  supplementVoucherHarvestDatesFromSupabase: vi.fn(async (rows: unknown[]) => rows),
}));

vi.mock('@/features/sync/syncQueueMutex', () => ({
  getSyncQueueLockSnapshot: vi.fn(() => ({
    locked: false,
    phase: 'idle',
    lockStartedAt: null,
    waitingSince: null,
    waiterCount: 0,
  })),
}));

import {
  fetchMergedServerVouchers,
  resetMergedServerVouchersCacheForTests,
} from './fetchMergedServerVouchers';

describe('fetchMergedServerVouchers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMergedServerVouchersCacheForTests();
    mocks.getAccessTokenFromSupabaseWithTimeout.mockResolvedValue('token');
    mocks.getTracebudApiBaseUrl.mockReturnValue('https://api.example.com');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/v1/harvest/vouchers/mine')) {
          return {
            status: 200,
            ok: true,
            json: async () => ({
              vouchers: [{ id: 'v1', plot_id: 'p1', kg: 100 }],
            }),
          };
        }
        return { status: 404, ok: false, json: async () => ({}) };
      }),
    );
  });

  it('prefers vouchers/mine and merges legacy farmer vouchers', async () => {
    mocks.fetchVouchersForFarmer.mockResolvedValue({
      vouchers: [{ id: 'v2', plot_id: 'p2', kg: 50 }],
    });

    const rows = await fetchMergedServerVouchers(['farmer-a']);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => (row as { id: string }).id).sort()).toEqual(['v1', 'v2']);
    expect(mocks.fetchVouchersForFarmer).toHaveBeenCalled();
  });

  it('falls back to per-farmer merge when mine endpoint is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 404, ok: false, json: async () => ({}) })),
    );
    mocks.fetchVouchersForFarmer.mockResolvedValue({
      vouchers: [{ id: 'v2', plot_id: 'p2', kg: 50 }],
    });

    const rows = await fetchMergedServerVouchers(['farmer-a', 'farmer-b']);
    expect(rows).toHaveLength(1);
    expect(mocks.fetchVouchersForFarmer).toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAccessTokenFromSupabase: vi.fn(),
  forceSyncAccessTokenRefresh: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/features/api/syncAuthSession', () => ({
  getAccessTokenFromSupabase: mocks.getAccessTokenFromSupabase,
  forceSyncAccessTokenRefresh: mocks.forceSyncAccessTokenRefresh,
}));

vi.mock('@/features/errors/ErrorLogger', () => ({
  logError: mocks.logError,
}));

vi.mock('@/features/api/runtimeGuards', () => ({
  getTracebudApiBaseUrl: () => 'https://api.example.com/api',
}));

import { fetchAuditForFarmer } from './audit';

describe('fetchAuditForFarmer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('retries once after invalid token and does not log auth noise', async () => {
    mocks.getAccessTokenFromSupabase
      .mockResolvedValueOnce('stale-token')
      .mockResolvedValueOnce('fresh-token');

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid token' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 'audit-1' }],
      } as Response);

    await expect(fetchAuditForFarmer('dcdd88e5-13e6-45d6-8e09-e6f1968e7e17')).resolves.toEqual([
      { id: 'audit-1' },
    ]);

    expect(mocks.forceSyncAccessTokenRefresh).toHaveBeenCalledTimes(1);
    expect(mocks.logError).not.toHaveBeenCalled();
  });

  it('throws sign_in_session_expired without logging when refresh still fails', async () => {
    mocks.getAccessTokenFromSupabase.mockResolvedValue('stale-token');
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid token' }),
    } as Response);

    await expect(fetchAuditForFarmer('farmer-1')).rejects.toThrow('sign_in_session_expired');
    expect(mocks.logError).not.toHaveBeenCalled();
  });
});

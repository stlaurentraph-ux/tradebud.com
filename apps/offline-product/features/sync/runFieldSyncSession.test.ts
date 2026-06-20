import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifySyncAccessToken = vi.fn();
const beginSyncAccessTokenRun = vi.fn();
const endSyncAccessTokenRun = vi.fn();
const beginServerPlotFetchRun = vi.fn();
const endServerPlotFetchRun = vi.fn();

vi.mock('@/features/api/syncAuthSession', () => ({
  verifySyncAccessToken,
  beginSyncAccessTokenRun,
  endSyncAccessTokenRun,
}));

vi.mock('@/features/api/runtimeGuards', () => ({
  getTracebudApiBaseUrl: () => 'https://api.tracebud.com/api',
}));

vi.mock('@/features/sync/serverPlotFetchCache', () => ({
  beginServerPlotFetchRun,
  endServerPlotFetchRun,
}));

describe('runFieldSyncSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns typed failure when token verify fails', async () => {
    verifySyncAccessToken.mockResolvedValue({ ok: false, reason: 'network' });
    const { openFieldSyncSession } = await import('./runFieldSyncSession');
    const result = await openFieldSyncSession();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.step).toBe('token_refresh');
      expect(result.failure.cause).toBe('network');
    }
    expect(beginServerPlotFetchRun).not.toHaveBeenCalled();
  });

  it('opens scoped token + plot fetch runs on success', async () => {
    verifySyncAccessToken.mockResolvedValue({ ok: true, token: 'token-abc' });
    const { withFieldSyncSession } = await import('./runFieldSyncSession');
    const result = await withFieldSyncSession(async (session) => session.accessToken);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('token-abc');
    }
    expect(beginServerPlotFetchRun).toHaveBeenCalledTimes(1);
    expect(beginSyncAccessTokenRun).toHaveBeenCalledWith('token-abc');
    expect(endSyncAccessTokenRun).toHaveBeenCalledTimes(1);
    expect(endServerPlotFetchRun).toHaveBeenCalledTimes(1);
  });
});

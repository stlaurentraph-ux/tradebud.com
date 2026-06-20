import { afterEach, describe, expect, it, vi } from 'vitest';

import { isSuccessfulApiResponse } from '@/features/network/apiFetchResponse';

vi.mock('@/features/api/runtimeGuards', () => ({
  getTracebudApiBaseUrl: () => 'https://api.tracebud.com/api',
}));

vi.mock('@/features/api/syncAuthSession', () => ({
  getAccessTokenFromSupabase: vi.fn(),
}));

describe('pingTracebudApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('isSuccessfulApiResponse treats 304 as reachable', () => {
    expect(isSuccessfulApiResponse(200)).toBe(true);
    expect(isSuccessfulApiResponse(304)).toBe(true);
    expect(isSuccessfulApiResponse(403)).toBe(false);
  });

  it('returns true when health responds 304 Not Modified', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 304,
      }),
    );

    const { pingTracebudApi } = await import('@/features/network/pingTracebudApi');
    await expect(pingTracebudApi()).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/api\.tracebud\.com\/api\/health\?_=\d+$/),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Cache-Control': 'no-cache' }),
      }),
    );
  });

  it('returns false when health is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network request failed')));

    const { pingTracebudApi } = await import('@/features/network/pingTracebudApi');
    await expect(pingTracebudApi()).resolves.toBe(false);
  });

  it('probeTracebudApiReachable uses provided access token before health ping', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/health')) {
          throw new TypeError('Network request failed');
        }
        return { ok: true, status: 200 };
      }),
    );

    const { probeTracebudApiReachable } = await import('@/features/network/pingTracebudApi');
    await expect(
      probeTracebudApiReachable({ accessToken: 'token-abc' }),
    ).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/api\.tracebud\.com\/api\/v1\/me\/field-farmer-ids\?_=\d+$/),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }),
      }),
    );
  });

  it('probeTracebudApiReachable falls back to authenticated GET when health fails', async () => {
    const { getAccessTokenFromSupabase } = await import('@/features/api/syncAuthSession');
    vi.mocked(getAccessTokenFromSupabase).mockResolvedValue('token-abc');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/health')) {
          throw new TypeError('Network request failed');
        }
        return { ok: true, status: 200 };
      }),
    );

    const { probeTracebudApiReachable } = await import('@/features/network/pingTracebudApi');
    await expect(probeTracebudApiReachable()).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/api\.tracebud\.com\/api\/v1\/me\/field-farmer-ids\?_=\d+$/),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }),
      }),
    );
  });
});

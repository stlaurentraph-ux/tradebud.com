import { afterEach, describe, expect, it, vi } from 'vitest';

import { isSuccessfulApiResponse } from '@/features/network/apiFetchResponse';

vi.mock('@/features/api/runtimeGuards', () => ({
  getTracebudApiBaseUrl: () => 'https://api.tracebud.com/api',
}));

describe('pingTracebudApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
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
      'https://api.tracebud.com/api/health',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('returns false when health is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network request failed')));

    const { pingTracebudApi } = await import('@/features/network/pingTracebudApi');
    await expect(pingTracebudApi()).resolves.toBe(false);
  });
});

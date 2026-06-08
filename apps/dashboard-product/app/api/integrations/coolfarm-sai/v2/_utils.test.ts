import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getBackendBase, proxyJson } from './_utils';

describe('coolfarm-sai v2 proxy utils', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('getBackendBase returns 503 when TRACEBUD_BACKEND_URL is missing', async () => {
    const res = getBackendBase();
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(503);
    await expect((res as Response).json()).resolves.toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for Cool Farm + SAI V2 operations.',
    });
  });

  it('getBackendBase strips trailing slash from backend url', () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test/';
    expect(getBackendBase()).toBe('https://backend.tracebud.test');
  });

  it('proxyJson forwards GET with authorization header', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ counts: { failed: 1 } }),
    } as Response);

    const request = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Bearer tenant_token' },
    });
    const res = await proxyJson(request, '/v1/integrations/coolfarm-sai/v2/runs/summary');

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/api/v1/integrations/coolfarm-sai/v2/runs/summary',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer tenant_token' },
      }),
    );
  });

  it('proxyJson forwards POST body and content-type', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ releasedCount: 2 }),
    } as Response);

    const request = new Request('http://localhost/api/test', { method: 'POST' });
    await proxyJson(request, '/v1/integrations/coolfarm-sai/v2/runs/release-stale', {
      method: 'POST',
      body: { staleMinutes: 30, limit: 10 },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/api/v1/integrations/coolfarm-sai/v2/runs/release-stale',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staleMinutes: 30, limit: 10 }),
      }),
    );
  });

  it('proxyJson passes backend non-2xx status through', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' }),
    } as Response);

    const res = await proxyJson(new Request('http://localhost/api/test'), '/v1/test');
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
  });
});

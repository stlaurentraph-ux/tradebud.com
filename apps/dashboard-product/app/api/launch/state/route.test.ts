import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

describe('launch state proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('fails with 503 when backend URL is missing', async () => {
    const response = await GET(new Request('http://localhost/api/launch/state'));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'TRACEBUD_BACKEND_URL is required.' });
  });

  it('forwards optional auth header for GET', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ onboardingComplete: true }),
    } as Response);

    const response = await GET(
      new Request('http://localhost/api/launch/state', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ onboardingComplete: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/api/v1/launch/state',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('returns backend error payload when launch state fetch fails', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Launch state unavailable.' }),
    } as Response);

    const response = await GET(new Request('http://localhost/api/launch/state'));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'Launch state unavailable.' });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, PATCH } from './route';

describe('Launch entitlements proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('fails with 503 when backend url is missing', async () => {
    const res = await GET(new Request('http://localhost/api/launch/entitlements'));
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ error: 'TRACEBUD_BACKEND_URL is required.' });
  });

  it('forwards GET to backend with authorization header', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ feature_key: 'dashboard_exports', entitlement_status: 'enabled' }],
    } as Response);

    const res = await GET(
      new Request('http://localhost/api/launch/entitlements', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/launch/entitlements',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards PATCH to backend with body and auth', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ feature_key: 'dashboard_exports', entitlement_status: 'disabled' }),
    } as Response);

    const res = await PATCH(
      new Request('http://localhost/api/launch/entitlements', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo_token',
        },
        body: JSON.stringify({
          feature: 'dashboard_exports',
          entitlementStatus: 'disabled',
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/launch/entitlements',
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo_token',
        },
        body: JSON.stringify({
          feature: 'dashboard_exports',
          entitlementStatus: 'disabled',
        }),
      }),
    );
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getPackageDetail } from './route';

describe('package detail proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('fails closed with 503 when backend URL is missing', async () => {
    const response = await getPackageDetail(
      new Request('http://localhost/api/harvest/packages/pkg_1'),
      { params: Promise.resolve({ id: 'pkg_1' }) },
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for package detail reads.',
    });
  });

  it('forwards package detail request with auth header', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        package: { id: 'pkg_1' },
        vouchers: [{ id: 'v_1' }],
      }),
    } as Response);

    const response = await getPackageDetail(
      new Request('http://localhost/api/harvest/packages/pkg_1', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
      { params: Promise.resolve({ id: 'pkg_1' }) },
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/harvest/packages/pkg_1',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });
});

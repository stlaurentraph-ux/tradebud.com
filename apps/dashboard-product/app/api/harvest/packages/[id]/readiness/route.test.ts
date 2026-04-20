import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getPackageReadiness } from './route';

describe('package readiness proxy route', () => {
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
    const response = await getPackageReadiness(
      new Request('http://localhost/api/harvest/packages/pkg_1/readiness'),
      { params: Promise.resolve({ id: 'pkg_1' }) },
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for package readiness reads.',
    });
  });

  it('forwards readiness request with auth header', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        packageId: 'pkg_1',
        status: 'blocked',
        blockers: [{ code: 'DOC_REJECTED', severity: 'blocker', message: 'rejected' }],
        warnings: [],
        checkedAt: '2026-04-16T00:00:00.000Z',
      }),
    } as Response);

    const response = await getPackageReadiness(
      new Request('http://localhost/api/harvest/packages/pkg_1/readiness', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
      { params: Promise.resolve({ id: 'pkg_1' }) },
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/harvest/packages/pkg_1/readiness',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH as submitPackage } from './route';

describe('package submit proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('forwards submit request with idempotency key', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://api.tracebud.com/api';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ packageId: 'pkg_1', status: 'submitted', idempotencyKey: 'idem-1' }),
    } as Response);

    const response = await submitPackage(
      new Request('http://localhost/api/harvest/packages/pkg_1/submit', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer demo_token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idempotencyKey: 'idem-1' }),
      }),
      { params: Promise.resolve({ id: 'pkg_1' }) },
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.tracebud.com/api/v1/harvest/packages/pkg_1/submit',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ idempotencyKey: 'idem-1' }),
      }),
    );
  });
});

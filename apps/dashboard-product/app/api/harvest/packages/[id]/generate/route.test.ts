import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as generatePackage } from './route';

describe('package generate proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('forwards generate request with auth header', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://api.tracebud.com/api';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ packageId: 'pkg_1', status: 'package_generated' }),
    } as Response);

    const response = await generatePackage(
      new Request('http://localhost/api/harvest/packages/pkg_1/generate', {
        method: 'POST',
        headers: { Authorization: 'Bearer demo_token' },
      }),
      { params: Promise.resolve({ id: 'pkg_1' }) },
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.tracebud.com/api/v1/harvest/packages/pkg_1/generate',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });
});

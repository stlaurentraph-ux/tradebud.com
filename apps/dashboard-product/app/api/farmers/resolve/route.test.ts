import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

describe('farmers resolve proxy route', () => {
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
    const response = await GET(new Request('http://localhost/api/farmers/resolve?email=farmer@test.com'));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is not configured.',
    });
  });

  it('returns 400 when email is missing', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';

    const response = await GET(new Request('http://localhost/api/farmers/resolve'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'email query parameter is required.',
    });
  });

  it('forwards resolve request with auth header', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ farmer_id: 'fp_1', email: 'farmer@test.com' }),
    } as Response);

    const response = await GET(
      new Request('http://localhost/api/farmers/resolve?email=farmer@test.com', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/api/v1/farmers/resolve?email=farmer%40test.com',
      expect.objectContaining({
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });
});

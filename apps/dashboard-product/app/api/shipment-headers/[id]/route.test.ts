import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

describe('shipment header detail proxy route', () => {
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
    const response = await GET(new Request('http://localhost/api/shipment-headers/shp_1'), {
      params: Promise.resolve({ id: 'shp_1' }),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'TRACEBUD_BACKEND_URL is required.' });
  });

  it('forwards shipment detail request with auth header', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ shipment: { id: 'shp_1' } }),
    } as Response);

    const response = await GET(
      new Request('http://localhost/api/shipment-headers/shp_1', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
      { params: Promise.resolve({ id: 'shp_1' }) },
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/api/v1/shipment-headers/shp_1',
      expect.objectContaining({
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });
});

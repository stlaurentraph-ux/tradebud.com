import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getMapPreview } from './route';

describe('plot map preview proxy route', () => {
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
    const res = await getMapPreview(new Request('http://localhost/api/plots/plot_1/map-preview'), {
      params: Promise.resolve({ id: 'plot_1' }),
    });

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for plot map preview.',
    });
  });

  it('passes Authorization header to backend map-preview endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'plot_1',
        name: 'Test plot',
        kind: 'point',
        area_ha: 2.5,
        status: 'compliant',
        geometry: { type: 'Point', coordinates: [30.06, -1.94] },
      }),
    } as Response);

    const res = await getMapPreview(
      new Request('http://localhost/api/plots/plot_1/map-preview', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
      { params: Promise.resolve({ id: 'plot_1' }) },
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/api/v1/plots/plot_1/map-preview',
      expect.objectContaining({
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });
});

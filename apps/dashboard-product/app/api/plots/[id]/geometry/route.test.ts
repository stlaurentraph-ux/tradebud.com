import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH as patchGeometry } from './route';

describe('plot geometry revision proxy route', () => {
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
    const res = await patchGeometry(
      new Request('http://localhost/api/plots/plot_1/geometry', {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'test', geometry: {} }),
      }),
      { params: Promise.resolve({ id: 'plot_1' }) },
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for plot geometry revision.',
    });
  });

  it('forwards PATCH body and Authorization to backend geometry endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'plot_1', kind: 'polygon' }),
    } as Response);

    const body = {
      reason: 'Removed GPS jitter',
      reviewerAssist: true,
      geometry: { type: 'Polygon', coordinates: [[[1, 2], [2, 2], [2, 3], [1, 3], [1, 2]]] },
    };

    const res = await patchGeometry(
      new Request('http://localhost/api/plots/plot_1/geometry', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer demo_token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id: 'plot_1' }) },
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/api/v1/plots/plot_1/geometry',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer demo_token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(body),
      }),
    );
  });
});

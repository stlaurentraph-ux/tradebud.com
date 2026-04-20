import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getGeometryHistory } from './route';

describe('plot geometry history proxy route', () => {
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
    const res = await getGeometryHistory(new Request('http://localhost/api/plots/plot_1/geometry-history'), {
      params: Promise.resolve({ id: 'plot_1' }),
    });

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for plot geometry history.',
    });
  });

  it('passes Authorization header and preserves camelCase payload shape', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: 'evt_1',
            timestamp: '2026-04-16T10:45:33.000Z',
            userId: '11111111-1111-4111-8111-111111111111',
            deviceId: 'device-field-01',
            eventType: 'plot_geometry_superseded',
            payload: {
              plotId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
              details: { reason: 'boundary correction after resurvey' },
            },
          },
        ],
        total: 1,
        anomalies: [
          {
            eventId: 'evt_1',
            type: 'large_revision_jump',
            severity: 'high',
            message: 'Large revision jump: 4.10% area correction variance.',
          },
        ],
        anomalySummary: {
          total: 1,
          highSeverity: 1,
          mediumSeverity: 0,
          byType: {
            largeRevisionJump: 1,
            frequentSupersession: 0,
          },
        },
        limit: 20,
        offset: 0,
      }),
    } as Response);

    const res = await getGeometryHistory(new Request('http://localhost/api/plots/plot_1/geometry-history?limit=20&offset=0&sort=asc&anomalyProfile=strict&signalsOnly=true', {
      headers: { Authorization: 'Bearer demo_token' },
    }), {
      params: Promise.resolve({ id: 'plot_1' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items[0]).toEqual(
      expect.objectContaining({
        eventType: 'plot_geometry_superseded',
        userId: '11111111-1111-4111-8111-111111111111',
        deviceId: 'device-field-01',
      }),
    );
    expect(body.items[0].event_type).toBeUndefined();
    expect(body.anomalies[0]).toEqual(
      expect.objectContaining({
        eventId: 'evt_1',
        type: 'large_revision_jump',
      }),
    );
    expect(body.anomalySummary).toEqual(
      expect.objectContaining({
        total: 1,
        highSeverity: 1,
      }),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/plots/plot_1/geometry-history?limit=20&offset=0&sort=asc&anomalyProfile=strict&signalsOnly=true',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('propagates backend denial payloads', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Plot scope violation' }),
    } as Response);

    const res = await getGeometryHistory(new Request('http://localhost/api/plots/plot_1/geometry-history'), {
      params: Promise.resolve({ id: 'plot_1' }),
    });

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Plot scope violation' });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getDecisionHistory } from './route';

describe('plot deforestation decision history proxy route', () => {
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
    const res = await getDecisionHistory(
      new Request('http://localhost/api/plots/plot_1/deforestation-decision-history'),
      {
        params: Promise.resolve({ id: 'plot_1' }),
      },
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for deforestation decision history.',
    });
  });

  it('passes Authorization header and forwards decision history payload', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: 'evt_1',
          event_type: 'plot_deforestation_decision_recorded',
          payload: {
            plotId: 'plot_1',
            cutoffDate: '2020-12-31',
            verdict: 'no_deforestation_detected',
          },
        },
      ],
    } as Response);

    const res = await getDecisionHistory(
      new Request('http://localhost/api/plots/plot_1/deforestation-decision-history', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
      {
        params: Promise.resolve({ id: 'plot_1' }),
      },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([
      expect.objectContaining({
        event_type: 'plot_deforestation_decision_recorded',
      }),
    ]);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/plots/plot_1/deforestation-decision-history',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });
});

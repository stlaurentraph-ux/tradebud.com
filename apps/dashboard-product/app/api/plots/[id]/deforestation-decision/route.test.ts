import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as runDecision } from './route';

describe('plot deforestation decision proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('fails with 400 when cutoffDate is missing', async () => {
    const res = await runDecision(
      new Request('http://localhost/api/plots/plot_1/deforestation-decision', { method: 'POST' }),
      { params: Promise.resolve({ id: 'plot_1' }) },
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: 'cutoffDate query param is required (YYYY-MM-DD).',
    });
  });

  it('forwards POST to backend with auth header', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, verdict: 'no_deforestation_detected' }),
    } as Response);

    const res = await runDecision(
      new Request('http://localhost/api/plots/plot_1/deforestation-decision?cutoffDate=2020-12-31', {
        method: 'POST',
        headers: { Authorization: 'Bearer demo_token' },
      }),
      { params: Promise.resolve({ id: 'plot_1' }) },
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/plots/plot_1/deforestation-decision?cutoffDate=2020-12-31',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });
});

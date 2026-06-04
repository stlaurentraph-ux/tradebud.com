import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as claimRun } from './route';

describe('Cool Farm V2 claim run proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('forwards claim POST for encoded run id', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'run-abc', claimedAt: '2026-06-02T12:00:00.000Z' }),
    } as Response);

    const res = await claimRun(
      new Request('http://localhost/api/integrations/coolfarm-sai/v2/runs/run%2Fabc/claim', {
        method: 'POST',
        headers: { Authorization: 'Bearer demo_token' },
      }),
      { params: Promise.resolve({ runId: 'run/abc' }) },
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/integrations/coolfarm-sai/v2/runs/run%2Fabc/claim',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer demo_token',
          'Content-Type': 'application/json',
        },
      }),
    );
  });
});

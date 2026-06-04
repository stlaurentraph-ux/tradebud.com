import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getRunSummary } from './route';

describe('Cool Farm V2 run summary proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('fails with 503 when backend url is not configured', async () => {
    const res = await getRunSummary(new Request('http://localhost/api/integrations/coolfarm-sai/v2/runs/summary'));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for Cool Farm + SAI V2 operations.',
    });
  });

  it('forwards summary request to backend with auth', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        counts: { started: 1, completed: 2, failed: 3 },
        staleClaimCount: 1,
      }),
    } as Response);

    const res = await getRunSummary(
      new Request('http://localhost/api/integrations/coolfarm-sai/v2/runs/summary', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/integrations/coolfarm-sai/v2/runs/summary',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });
});

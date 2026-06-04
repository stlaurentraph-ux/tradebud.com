import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as triggerStaleSweeper } from './route';

describe('Cool Farm V2 stale sweeper trigger proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;
  const originalSchedulerToken = process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN = 'scheduler-secret';
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
    if (originalSchedulerToken) process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN = originalSchedulerToken;
    else delete process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN;
  });

  it('fails with 503 when scheduler token is not configured', async () => {
    delete process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN;
    const res = await triggerStaleSweeper(
      new Request('http://localhost/api/integrations/coolfarm-sai/v2/runs/release-stale/trigger', {
        method: 'POST',
        body: JSON.stringify({ staleMinutes: 60, limit: 10 }),
      }),
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'COOLFARM_SAI_V2_SCHEDULER_TOKEN is not configured for scheduler trigger proxy.',
    });
  });

  it('forwards trigger with server-side scheduler token header', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ releasedCount: 3, triggerSource: 'manual' }),
    } as Response);

    const res = await triggerStaleSweeper(
      new Request('http://localhost/api/integrations/coolfarm-sai/v2/runs/release-stale/trigger', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer demo_token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ staleMinutes: 45, limit: 20 }),
      }),
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/integrations/coolfarm-sai/v2/runs/release-stale/trigger',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tracebud-scheduler-token': 'scheduler-secret',
          Authorization: 'Bearer demo_token',
        },
        body: JSON.stringify({ staleMinutes: 45, limit: 20 }),
      }),
    );
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getRetryQueue } from './route';

describe('Cool Farm V2 retry queue proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('forwards limit query param to backend', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [], dueCount: 0 }),
    } as Response);

    await getRetryQueue(
      new Request('http://localhost/api/integrations/coolfarm-sai/v2/runs/retry-queue?limit=25'),
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/integrations/coolfarm-sai/v2/runs/retry-queue?limit=25',
      expect.any(Object),
    );
  });
});

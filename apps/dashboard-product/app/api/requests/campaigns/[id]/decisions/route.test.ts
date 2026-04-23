import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as listDecisionTimeline } from './route';

describe('request campaigns decision timeline proxy route', () => {
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
    const res = await listDecisionTimeline(new Request('http://localhost/api/requests/campaigns/camp_1/decisions'), {
      params: Promise.resolve({ id: 'camp_1' }),
    });

    expect(res.status).toBe(503);
  });

  it('forwards auth header and campaign id to backend', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        campaign_id: 'camp_1',
        tenant_id: 'tenant_1',
        last_synced_at: '2026-04-22T12:00:00.000Z',
        decisions: [],
      }),
    } as Response);

    const res = await listDecisionTimeline(
      new Request('http://localhost/api/requests/campaigns/camp_1/decisions', {
        method: 'GET',
        headers: { Authorization: 'Bearer demo_token' },
      }),
      { params: Promise.resolve({ id: 'camp_1' }) },
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/requests/campaigns/camp_1/decisions',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer demo_token',
        }),
      }),
    );
  });

  it('forwards decision query params to backend', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        campaign_id: 'camp_1',
        tenant_id: 'tenant_1',
        last_synced_at: null,
        decisions: [],
      }),
    } as Response);

    const res = await listDecisionTimeline(
      new Request(
        'http://localhost/api/requests/campaigns/camp_1/decisions?decision=accept&limit=10&offset=20',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer demo_token' },
        },
      ),
      { params: Promise.resolve({ id: 'camp_1' }) },
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/requests/campaigns/camp_1/decisions?decision=accept&limit=10&offset=20',
      expect.any(Object),
    );
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as createRequestCampaign } from './route';

describe('request campaigns create proxy route', () => {
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
    const res = await createRequestCampaign(
      new Request('http://localhost/api/requests/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(503);
  });

  it('forwards payload/auth/idempotency key to backend', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({ campaign_id: 'camp_1', status: 'QUEUED' }),
    } as Response);

    const res = await createRequestCampaign(
      new Request('http://localhost/api/requests/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo_token',
          'X-Idempotency-Key': 'idem-123',
        },
        body: JSON.stringify({
          request_type: 'GENERAL_EVIDENCE',
          campaign_name: 'Bulk Outreach',
          description_template: 'Please upload evidence',
          due_date: '2026-05-01',
          targets: [{ email: 'jane@example.com', full_name: 'Jane Doe' }],
        }),
      }),
    );

    expect(res.status).toBe(202);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/requests/campaigns',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer demo_token',
          'X-Idempotency-Key': 'idem-123',
        }),
      }),
    );
  });
});

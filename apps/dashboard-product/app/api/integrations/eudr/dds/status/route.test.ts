import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getDdsStatus } from './route';

describe('EUDR DDS status proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('fails with 400 when referenceNumber is missing', async () => {
    const res = await getDdsStatus(
      new Request('http://localhost/api/integrations/eudr/dds/status', {
        method: 'GET',
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'referenceNumber query param is required.' });
  });

  it('fails with 503 when backend url is not configured', async () => {
    const res = await getDdsStatus(
      new Request('http://localhost/api/integrations/eudr/dds/status?referenceNumber=TB-REF-001', {
        method: 'GET',
      }),
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for EUDR DDS status reads.',
    });
  });

  it('forwards status request to backend with auth', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, payload: { status: 'accepted' } }),
    } as Response);

    const res = await getDdsStatus(
      new Request('http://localhost/api/integrations/eudr/dds/status?referenceNumber=TB-REF-001', {
        method: 'GET',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/integrations/eudr/dds/status?referenceNumber=TB-REF-001',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('passes backend non-2xx status payload through unchanged', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'EUDR DDS status response was not valid JSON' }),
    } as Response);

    const res = await getDdsStatus(
      new Request('http://localhost/api/integrations/eudr/dds/status?referenceNumber=TB-REF-ERR-001', {
        method: 'GET',
      }),
    );

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: 'EUDR DDS status response was not valid JSON' });
  });
});


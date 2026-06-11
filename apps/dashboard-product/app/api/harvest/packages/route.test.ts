import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('harvest packages create proxy route', () => {
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
    const response = await POST(
      new Request('http://localhost/api/harvest/packages', {
        method: 'POST',
        body: JSON.stringify({ voucherIds: ['v_1'] }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for package creation.',
    });
  });

  it('forwards package create request with auth header', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'pkg_1', status: 'draft' }),
    } as Response);

    const response = await POST(
      new Request('http://localhost/api/harvest/packages', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer demo_token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voucherIds: ['v_1', 'v_2'],
          label: 'Rwanda Coffee Cooperative — Season A 2026',
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/api/v1/harvest/packages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer demo_token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          voucherIds: ['v_1', 'v_2'],
          label: 'Rwanda Coffee Cooperative — Season A 2026',
        }),
      }),
    );
  });
});

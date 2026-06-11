import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

describe('farmer consent grants proxy route', () => {
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
    const response = await GET(new Request('http://localhost/api/farmers/fp_1/consent-grants'), {
      params: Promise.resolve({ id: 'fp_1' }),
    });

    expect(response.status).toBe(503);
  });

  it('forwards consent grant list', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [{ id: 'cg_1', status: 'active' }], sold_lineage_retention_years: 5 }),
    } as Response);

    const response = await GET(
      new Request('http://localhost/api/farmers/fp_1/consent-grants', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
      { params: Promise.resolve({ id: 'fp_1' }) },
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/api/v1/farmers/fp_1/consent-grants',
      expect.objectContaining({
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });
});

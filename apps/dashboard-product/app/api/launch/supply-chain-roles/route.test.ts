import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH } from './route';

describe('launch supply-chain-roles proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('fails with 503 when backend URL is missing', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/launch/supply-chain-roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplyChainRoles: ['importer'] }),
      }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'TRACEBUD_BACKEND_URL is required.' });
  });

  it('fails with 401 when authorization is missing', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const response = await PATCH(
      new Request('http://localhost/api/launch/supply-chain-roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplyChainRoles: ['importer'] }),
      }),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Authorization header is required.' });
  });

  it('forwards payload and auth header to backend', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response);

    const response = await PATCH(
      new Request('http://localhost/api/launch/supply-chain-roles', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer demo_token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supplyChainRoles: ['importer', 'exporter'] }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/api/v1/launch/supply-chain-roles',
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo_token',
        },
      }),
    );
  });
});

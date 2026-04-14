import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { GET as listInboxRequests } from './route';
import { POST as respondInboxRequest } from './[id]/respond/route';
import { POST as bootstrapInboxRequests } from './bootstrap/route';

describe('inbox API proxy routes', () => {
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
    const listRes = await listInboxRequests(new Request('http://localhost/api/inbox-requests'));
    const respondRes = await respondInboxRequest(new Request('http://localhost/api/inbox-requests/req_1/respond', { method: 'POST' }), {
      params: Promise.resolve({ id: 'req_1' }),
    });
    const bootstrapRes = await bootstrapInboxRequests(
      new Request('http://localhost/api/inbox-requests/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })
    );

    expect(listRes.status).toBe(503);
    expect(respondRes.status).toBe(503);
    expect(bootstrapRes.status).toBe(503);
  });

  it('passes Authorization header through to backend list endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ requests: [] }),
    } as Response);

    const res = await listInboxRequests(
      new Request('http://localhost/api/inbox-requests', {
        headers: { Authorization: 'Bearer test-token' },
      })
    );

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://backend.tracebud.test/api/v1/inbox-requests',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
      })
    );
  });

  it('passes Authorization header through to backend respond and bootstrap endpoints', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response);

    const respondRes = await respondInboxRequest(
      new Request('http://localhost/api/inbox-requests/req_1/respond', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
      }),
      { params: Promise.resolve({ id: 'req_1' }) }
    );
    const bootstrapRes = await bootstrapInboxRequests(
      new Request('http://localhost/api/inbox-requests/bootstrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ action: 'seed_first_customer' }),
      })
    );

    expect(respondRes.status).toBe(200);
    expect(bootstrapRes.status).toBe(200);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://backend.tracebud.test/api/v1/inbox-requests/req_1/respond',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://backend.tracebud.test/api/v1/inbox-requests/bootstrap',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('propagates backend auth and permission errors for list/respond/bootstrap', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Missing or invalid auth token.' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Tenant scope violation.' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Only exporter/admin users can run inbox bootstrap actions.' }),
      } as Response);

    const listRes = await listInboxRequests(new Request('http://localhost/api/inbox-requests'));
    const respondRes = await respondInboxRequest(
      new Request('http://localhost/api/inbox-requests/req_1/respond', { method: 'POST' }),
      { params: Promise.resolve({ id: 'req_1' }) }
    );
    const bootstrapRes = await bootstrapInboxRequests(
      new Request('http://localhost/api/inbox-requests/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })
    );

    expect(listRes.status).toBe(401);
    expect(await listRes.json()).toEqual({ error: 'Missing or invalid auth token.' });

    expect(respondRes.status).toBe(403);
    expect(await respondRes.json()).toEqual({ error: 'Tenant scope violation.' });

    expect(bootstrapRes.status).toBe(403);
    expect(await bootstrapRes.json()).toEqual({
      error: 'Only exporter/admin users can run inbox bootstrap actions.',
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('commercial profile proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;
  const originalDevBypass = process.env.TRACEBUD_DEV_SIGNUP_BYPASS;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
    delete process.env.TRACEBUD_DEV_SIGNUP_BYPASS;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
    if (originalDevBypass) process.env.TRACEBUD_DEV_SIGNUP_BYPASS = originalDevBypass;
    else delete process.env.TRACEBUD_DEV_SIGNUP_BYPASS;
  });

  it('fails with 503 when backend URL is missing', async () => {
    const response = await POST(
      new Request('http://localhost/api/launch/commercial-profile', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer demo_token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skipped: true }),
      }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'TRACEBUD_BACKEND_URL is required.' });
  });

  it('fails with 401 when authorization is missing', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const response = await POST(
      new Request('http://localhost/api/launch/commercial-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipped: true }),
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

    const response = await POST(
      new Request('http://localhost/api/launch/commercial-profile', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer demo_token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skipped: false,
          teamSize: '11-50',
          mainCommodity: 'coffee',
          primaryObjective: 'risk_screening',
          primaryRole: 'importer',
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/launch/commercial-profile',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo_token',
        },
      }),
    );
  });

  it('returns success payload in local bypass mode', async () => {
    process.env.TRACEBUD_DEV_SIGNUP_BYPASS = 'true';
    const response = await POST(
      new Request('http://localhost/api/launch/commercial-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skipped: true,
          primaryRole: 'importer',
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        message: 'Local dev signup bypass enabled.',
      }),
    );
  });
});

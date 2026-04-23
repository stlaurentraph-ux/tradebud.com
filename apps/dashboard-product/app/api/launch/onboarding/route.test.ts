import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

describe('launch onboarding proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('fails with 503 when backend URL is missing (GET)', async () => {
    const response = await GET(new Request('http://localhost/api/launch/onboarding?role=admin'));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'TRACEBUD_BACKEND_URL is required.' });
  });

  it('forwards role query + auth header for GET', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [{ step_key: 'create_first_campaign', completed: true }] }),
    } as Response);

    const response = await GET(
      new Request('http://localhost/api/launch/onboarding?role=compliance_manager', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      items: [{ step_key: 'create_first_campaign', completed: true }],
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/launch/onboarding?role=compliance_manager',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('fails with 503 when backend URL is missing (POST)', async () => {
    const response = await POST(
      new Request('http://localhost/api/launch/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'compliance_manager', stepKey: 'create_first_campaign' }),
      }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'TRACEBUD_BACKEND_URL is required.' });
  });

  it('forwards completion payload + auth header for POST', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response);

    const response = await POST(
      new Request('http://localhost/api/launch/onboarding', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer demo_token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'compliance_manager', stepKey: 'create_first_campaign' }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/launch/onboarding/complete',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo_token',
        },
        body: JSON.stringify({ role: 'compliance_manager', stepKey: 'create_first_campaign' }),
      }),
    );
  });

  it('returns explicit 503 when GET backend request throws', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

    const response = await GET(
      new Request('http://localhost/api/launch/onboarding?role=compliance_manager', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'Unable to reach launch backend. Ensure backend server is running and reachable.',
    });
  });

  it('returns explicit 503 when POST backend request throws', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

    const response = await POST(
      new Request('http://localhost/api/launch/onboarding', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer demo_token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'compliance_manager', stepKey: 'create_first_campaign' }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'Unable to reach launch backend. Ensure backend server is running and reachable.',
    });
  });
});

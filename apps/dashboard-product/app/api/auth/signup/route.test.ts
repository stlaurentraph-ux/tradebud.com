import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('auth signup proxy route', () => {
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
      new Request('http://localhost/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'create_account', workEmail: 'ops@tracebud.test' }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'TRACEBUD_BACKEND_URL is required.' });
  });

  it('rejects workspace setup stage without authorization header', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const response = await POST(
      new Request('http://localhost/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'workspace_setup', organizationName: 'Tracebud Ops' }),
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: 'Authorization header is required for workspace setup stage.',
    });
  });

  it('forwards create-account stage to backend', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ userId: 'user_1', tenantId: 'tenant_1' }),
    } as Response);

    const response = await POST(
      new Request('http://localhost/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'create_account',
          workEmail: 'ops@tracebud.test',
          password: 'test_password',
          fullName: 'Ops User',
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ userId: 'user_1', tenantId: 'tenant_1' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/launch/signup',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('forwards workspace-setup stage with authorization header', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response);

    const response = await POST(
      new Request('http://localhost/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo_token',
        },
        body: JSON.stringify({
          stage: 'workspace_setup',
          organizationName: 'Tracebud Ops',
          country: 'France',
          primaryRole: 'importer',
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/launch/signup',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo_token',
        },
      }),
    );
  });

  it('returns explicit 503 when backend request throws', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

    const response = await POST(
      new Request('http://localhost/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'create_account',
          workEmail: 'ops@tracebud.test',
          password: 'test_password',
          fullName: 'Ops User',
        }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'Unable to reach launch backend. Ensure backend server is running and Supabase is reachable.',
    });
  });

  it('returns local dev token in bypass mode for create-account stage', async () => {
    process.env.TRACEBUD_DEV_SIGNUP_BYPASS = 'true';
    const response = await POST(
      new Request('http://localhost/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'create_account',
          workEmail: 'local.qa@tracebud.dev',
          password: 'ignored',
          fullName: 'Local QA',
        }),
      }),
    );

    const payload = (await response.json()) as { accessToken?: string; tenantId?: string; message?: string };
    expect(response.status).toBe(200);
    expect(payload.tenantId).toBe('tenant_dev_local_qa_tracebud_dev');
    expect(payload.accessToken).toContain('.');
    expect(payload.message).toBe('Local dev signup bypass enabled.');
  });
});

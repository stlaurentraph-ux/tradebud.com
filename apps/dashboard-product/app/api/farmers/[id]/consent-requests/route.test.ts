import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('farmer consent requests proxy route', () => {
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
      new Request('http://localhost/api/farmers/fp_1/consent-requests', {
        method: 'POST',
        body: JSON.stringify({ purpose_code: 'COMPLIANCE_COLLECTION' }),
      }),
      { params: Promise.resolve({ id: 'fp_1' }) },
    );

    expect(response.status).toBe(503);
  });

  it('forwards consent request creation', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        consent_grant_id: 'cg_1',
        status: 'pending',
        farmer_id: 'fp_1',
        grantee_tenant_id: 'tenant_1',
      }),
    } as Response);

    const response = await POST(
      new Request('http://localhost/api/farmers/fp_1/consent-requests', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer demo_token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grantee_org_name: 'Coop A', purpose_code: 'COMPLIANCE_COLLECTION' }),
      }),
      { params: Promise.resolve({ id: 'fp_1' }) },
    );

    expect(response.status).toBe(201);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/api/v1/farmers/fp_1/consent-requests',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer demo_token' }),
      }),
    );
  });
});

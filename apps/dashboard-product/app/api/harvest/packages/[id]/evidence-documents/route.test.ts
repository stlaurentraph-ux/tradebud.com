import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getPackageEvidenceDocuments } from './route';

describe('package evidence-documents proxy route', () => {
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
    const response = await getPackageEvidenceDocuments(
      new Request('http://localhost/api/harvest/packages/pkg_1/evidence-documents'),
      { params: Promise.resolve({ id: 'pkg_1' }) },
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for package evidence-document reads.',
    });
  });

  it('forwards evidence-documents request with auth header', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ evidenceId: 'evidence_v_1' }],
    } as Response);

    const response = await getPackageEvidenceDocuments(
      new Request('http://localhost/api/harvest/packages/pkg_1/evidence-documents', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
      { params: Promise.resolve({ id: 'pkg_1' }) },
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/harvest/packages/pkg_1/evidence-documents',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });
});

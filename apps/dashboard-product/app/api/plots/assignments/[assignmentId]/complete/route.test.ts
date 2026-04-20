import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH as completeAssignment } from './route';

describe('plot assignment complete proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('propagates backend denial payloads', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    vi.spyOn(global, 'fetch').mockResolvedValue({
      status: 400,
      ok: false,
      json: async () => ({ error: 'ASN-003: Invalid assignment state transition.' }),
    } as Response);

    const res = await completeAssignment(
      new Request('http://localhost/api/plots/assignments/assign_1/complete', {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'completed' }),
      }),
      { params: Promise.resolve({ assignmentId: 'assign_1' }) },
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'ASN-003: Invalid assignment state transition.' });
  });
});

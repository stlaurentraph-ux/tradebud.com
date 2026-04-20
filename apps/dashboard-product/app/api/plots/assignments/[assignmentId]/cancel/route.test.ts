import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH as cancelAssignment } from './route';

describe('plot assignment cancel proxy route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('returns 503 when backend URL is missing', async () => {
    const res = await cancelAssignment(
      new Request('http://localhost/api/plots/assignments/assign_1/cancel', {
        method: 'PATCH',
      }),
      { params: Promise.resolve({ assignmentId: 'assign_1' }) },
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for plot assignment lifecycle.',
    });
  });
});

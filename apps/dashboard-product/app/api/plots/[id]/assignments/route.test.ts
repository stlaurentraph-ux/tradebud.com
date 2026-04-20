import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as listAssignments, POST as createAssignment } from './route';

describe('plot assignment create proxy route', () => {
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
    const res = await createAssignment(
      new Request('http://localhost/api/plots/plot_1/assignments', {
        method: 'POST',
        body: JSON.stringify({ assignmentId: 'assign_1', agentUserId: 'agent_1' }),
      }),
      { params: Promise.resolve({ id: 'plot_1' }) },
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for plot assignment lifecycle.',
    });
  });

  it('passes auth header and backend payload/status', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      status: 201,
      ok: true,
      json: async () => ({ assignmentId: 'assign_1', status: 'active' }),
    } as Response);

    const res = await createAssignment(
      new Request('http://localhost/api/plots/plot_1/assignments', {
        method: 'POST',
        headers: { Authorization: 'Bearer demo_token' },
        body: JSON.stringify({ assignmentId: 'assign_1', agentUserId: 'agent_1' }),
      }),
      { params: Promise.resolve({ id: 'plot_1' }) },
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ assignmentId: 'assign_1', status: 'active' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/plots/plot_1/assignments',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer demo_token' }),
      }),
    );
  });

  it('lists assignment rows from backend', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ items: [{ assignmentId: 'assign_1', status: 'active' }], total: 1 }),
    } as Response);

    const res = await listAssignments(
      new Request('http://localhost/api/plots/plot_1/assignments?status=active&fromDays=14&limit=10&offset=0', {
        method: 'GET',
        headers: { Authorization: 'Bearer demo_token' },
      }),
      { params: Promise.resolve({ id: 'plot_1' }) },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.objectContaining({ items: [expect.objectContaining({ assignmentId: 'assign_1' })], total: 1 }),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/plots/plot_1/assignments?status=active&fromDays=14&limit=10&offset=0',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it('passes through csv exports from backend', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => 'assignment_id,status\n"assign_1","active"',
      headers: new Headers({
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="plot-plot_1-assignments.csv"',
        'x-export-row-count': '1',
      }),
    } as Response);

    const res = await listAssignments(
      new Request('http://localhost/api/plots/plot_1/assignments?status=active&format=csv', {
        method: 'GET',
        headers: { Authorization: 'Bearer demo_token' },
      }),
      { params: Promise.resolve({ id: 'plot_1' }) },
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toContain('assignment_id,status');
    expect(res.headers.get('x-export-row-count')).toBe('1');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/plots/plot_1/assignments?status=active&format=csv',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

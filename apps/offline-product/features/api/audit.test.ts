import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  getAccessTokenFromSupabase: vi.fn(async () => 'token-abc'),
}));

vi.mock('./auth', () => authMocks);
vi.mock('./runtimeGuards', () => ({
  getTracebudApiBaseUrl: () => 'https://api.tracebud.com/api',
}));
vi.mock('@/features/errors/ErrorLogger', () => ({
  logError: vi.fn(),
}));

import { postAuditEventsBatchToBackend } from './audit';

describe('postAuditEventsBatchToBackend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn() as typeof fetch;
  });

  it('falls back to single POST /v1/audit when batch route is not deployed (404)', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: 'Cannot POST /api/v1/audit/batch',
            error: 'Not Found',
            statusCode: 404,
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'evt-1', ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const result = await postAuditEventsBatchToBackend([
      {
        eventType: 'plot_compliance_declared',
        clientEventId: 'pending-sync-1',
        payload: { farmerId: 'farmer-1', plotId: 'plot-1' },
      },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.accepted).toBe(1);
      expect(result.results[0]?.ok).toBe(true);
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/v1/audit/batch');
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe('https://api.tracebud.com/api/v1/audit');
  });
});

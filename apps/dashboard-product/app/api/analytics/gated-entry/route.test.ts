import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getGatedEntryTelemetry, POST as postGatedEntryTelemetry } from './route';

describe('gated-entry analytics route', () => {
  const originalBackendUrl = process.env.TRACEBUD_BACKEND_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRACEBUD_BACKEND_URL;
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.TRACEBUD_BACKEND_URL = originalBackendUrl;
    else delete process.env.TRACEBUD_BACKEND_URL;
  });

  it('rejects invalid feature marker', async () => {
    const res = await postGatedEntryTelemetry(
      new Request('http://localhost/api/analytics/gated-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'other_feature',
          gate: 'annual_reporting',
          tenantId: 'tenant_1',
          role: 'exporter',
        }),
      }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'feature must be mvp_gated.' });
  });

  it('fails closed for GET when backend URL is missing', async () => {
    const res = await getGatedEntryTelemetry(
      new Request('http://localhost/api/analytics/gated-entry', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'TRACEBUD_BACKEND_URL is required for gated-entry analytics reads.',
    });
  });

  it('rejects unsupported gate marker', async () => {
    const res = await postGatedEntryTelemetry(
      new Request('http://localhost/api/analytics/gated-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'mvp_gated',
          gate: 'unknown_gate',
          tenantId: 'tenant_1',
          role: 'exporter',
        }),
      }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'gate must be a supported deferred gate.' });
  });

  it('returns 202 and local sink when backend URL is missing', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const res = await postGatedEntryTelemetry(
      new Request('http://localhost/api/analytics/gated-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'mvp_gated',
          gate: 'request_campaigns',
          tenantId: 'tenant_1',
          role: 'importer',
          redirectedPath: '/',
        }),
      }),
    );

    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ ok: true, sink: 'local' });
    expect(infoSpy).toHaveBeenCalledWith(
      '[telemetry] gated-entry',
      expect.objectContaining({
        eventType: 'dashboard_gated_entry_attempt',
        gate: 'request_campaigns',
        role: 'importer',
      }),
    );
  });

  it('forwards telemetry to backend audit route with auth header when configured', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1 }),
    } as Response);

    const res = await postGatedEntryTelemetry(
      new Request('http://localhost/api/analytics/gated-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo_token',
        },
        body: JSON.stringify({
          feature: 'mvp_gated',
          gate: 'annual_reporting',
          tenantId: 'tenant_1',
          role: 'exporter',
          redirectedPath: '/',
        }),
      }),
    );

    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ ok: true, sink: 'backend' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer demo_token',
        }),
        body: expect.any(String),
      }),
    );
  });

  it('forwards GET reads to backend gated-entry endpoint with auth header', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: 'evt_1', event_type: 'dashboard_gated_entry_attempt' }],
    } as Response);

    const res = await getGatedEntryTelemetry(
      new Request('http://localhost/api/analytics/gated-entry', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 'evt_1', event_type: 'dashboard_gated_entry_attempt' }]);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });
});

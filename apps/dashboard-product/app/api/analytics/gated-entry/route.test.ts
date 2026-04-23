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

  it('supports onboarding CTA gated redirect event type', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const res = await postGatedEntryTelemetry(
      new Request('http://localhost/api/analytics/gated-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'onboarding_cta_gated_redirect',
          feature: 'mvp_gated',
          gate: 'request_campaigns',
          tenantId: 'tenant_1',
          role: 'importer',
          redirectedPath: '/requests',
        }),
      }),
    );

    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ ok: true, sink: 'local' });
    expect(infoSpy).toHaveBeenCalledWith(
      '[telemetry] gated-entry',
      expect.objectContaining({
        eventType: 'onboarding_cta_gated_redirect',
        redirectedPath: '/requests',
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
      new Request('http://localhost/api/analytics/gated-entry?gate=request_campaigns&fromHours=24&limit=10&offset=20&sort=asc', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 'evt_1', event_type: 'dashboard_gated_entry_attempt' }]);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry?gate=request_campaigns&fromHours=24&limit=10&offset=20&sort=asc',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards CSV export reads to backend gated-entry export endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const csvBody = 'captured_at,gate,role,feature,redirected_path\n2026-04-15T12:00:00.000Z,request_campaigns,buyer,mvp_gated,/';
    const headers = new Headers({
      'x-export-row-limit': '5000',
      'x-export-row-count': '1',
      'x-export-truncated': 'false',
    });
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => csvBody,
      headers,
    } as unknown as Response);

    const res = await getGatedEntryTelemetry(
      new Request('http://localhost/api/analytics/gated-entry?gate=request_campaigns&fromHours=24&sort=desc&format=csv', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(res.headers.get('x-export-row-limit')).toBe('5000');
    expect(res.headers.get('x-export-row-count')).toBe('1');
    expect(res.headers.get('x-export-truncated')).toBe('false');
    expect(await res.text()).toContain('captured_at,gate,role,feature,redirected_path');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry/export?gate=request_campaigns&fromHours=24&sort=desc',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards export-activity reads to backend gated-entry exports endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [{ id: 'evt_export_1', event_type: 'dashboard_gated_entry_exported' }],
        total: 1,
        limit: 10,
        offset: 0,
      }),
    } as Response);

    const res = await getGatedEntryTelemetry(
      new Request('http://localhost/api/analytics/gated-entry?eventKind=exports&fromHours=24&limit=10&offset=0&sort=desc', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );

    expect(res.status).toBe(200);
    expect((await res.json()).items).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry/exports?fromHours=24&limit=10&offset=0&sort=desc',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards assignment-export reads to backend assignment-exports endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [{ id: 'evt_assign_1', event_type: 'plot_assignment_export_succeeded' }],
        total: 1,
        limit: 10,
        offset: 0,
      }),
    } as Response);

    const res = await getGatedEntryTelemetry(
      new Request(
        'http://localhost/api/analytics/gated-entry?eventKind=assignment_exports&fromHours=24&phase=succeeded&status=active&limit=10&offset=0&sort=desc',
        {
          headers: { Authorization: 'Bearer demo_token' },
        },
      ),
    );

    expect(res.status).toBe(200);
    expect((await res.json()).items).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry/assignment-exports?fromHours=24&limit=10&offset=0&sort=desc&phase=succeeded&status=active',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards assignment-export CSV reads to backend assignment-exports export endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const csvBody = 'captured_at,actor,phase,status,from_days,agent_user_id,row_count,error';
    const headers = new Headers({
      'x-export-row-limit': '5000',
      'x-export-row-count': '0',
      'x-export-truncated': 'false',
    });
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => csvBody,
      headers,
    } as unknown as Response);

    const res = await getGatedEntryTelemetry(
      new Request(
        'http://localhost/api/analytics/gated-entry?eventKind=assignment_exports&format=csv&fromHours=24&phase=failed&status=active&sort=desc',
        {
          headers: { Authorization: 'Bearer demo_token' },
        },
      ),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry/assignment-exports/export?fromHours=24&sort=desc&phase=failed&status=active',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards risk-score activity reads to backend risk-scores endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [{ id: 'evt_risk_1', event_type: 'dds_package_risk_score_medium' }],
        total: 1,
        limit: 10,
        offset: 0,
      }),
    } as Response);

    const res = await getGatedEntryTelemetry(
      new Request(
        'http://localhost/api/analytics/gated-entry?eventKind=risk_scores&fromHours=24&phase=medium&band=medium&limit=10&offset=0&sort=desc',
        {
          headers: { Authorization: 'Bearer demo_token' },
        },
      ),
    );

    expect(res.status).toBe(200);
    expect((await res.json()).items).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry/risk-scores?fromHours=24&limit=10&offset=0&sort=desc&phase=medium&band=medium',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards risk-score CSV reads to backend risk-scores export endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const csvBody = 'captured_at,actor,phase,package_id,provider,band,score,reason_count,scored_at';
    const headers = new Headers({
      'x-export-row-limit': '5000',
      'x-export-row-count': '0',
      'x-export-truncated': 'false',
    });
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => csvBody,
      headers,
    } as unknown as Response);

    const res = await getGatedEntryTelemetry(
      new Request(
        'http://localhost/api/analytics/gated-entry?eventKind=risk_scores&format=csv&fromHours=24&phase=medium&band=medium&sort=desc',
        {
          headers: { Authorization: 'Bearer demo_token' },
        },
      ),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry/risk-scores/export?fromHours=24&sort=desc&phase=medium&band=medium',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards filing-activity reads to backend filing-activity endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [{ id: 'evt_file_1', event_type: 'dds_package_submission_accepted' }],
        total: 1,
        limit: 10,
        offset: 0,
      }),
    } as Response);
    const res = await getGatedEntryTelemetry(
      new Request(
        'http://localhost/api/analytics/gated-entry?eventKind=filing_activity&fromHours=24&phase=submission_accepted&limit=10&offset=0&sort=desc',
        { headers: { Authorization: 'Bearer demo_token' } },
      ),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).items).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry/filing-activity?fromHours=24&limit=10&offset=0&sort=desc&phase=submission_accepted',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards filing-activity CSV reads to backend filing-activity export endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const csvBody = 'captured_at,actor,phase,package_id,status,artifact_version,lot_count,idempotency_key,submission_state,traces_reference,replayed,persisted_at,generated_at';
    const headers = new Headers({
      'x-export-row-limit': '5000',
      'x-export-row-count': '0',
      'x-export-truncated': 'false',
    });
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => csvBody,
      headers,
    } as unknown as Response);
    const res = await getGatedEntryTelemetry(
      new Request(
        'http://localhost/api/analytics/gated-entry?eventKind=filing_activity&format=csv&fromHours=24&phase=submission_replayed&sort=desc',
        { headers: { Authorization: 'Bearer demo_token' } },
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry/filing-activity/export?fromHours=24&sort=desc&phase=submission_replayed',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards chat-thread activity reads to backend chat-thread diagnostics endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [{ id: 'evt_chat_1', event_type: 'chat_thread_created' }],
        total: 1,
        limit: 10,
        offset: 0,
      }),
    } as Response);
    const res = await getGatedEntryTelemetry(
      new Request(
        'http://localhost/api/analytics/gated-entry?eventKind=chat_threads&fromHours=24&phase=created&limit=10&offset=0&sort=desc',
        { headers: { Authorization: 'Bearer demo_token' } },
      ),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).items).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry/chat-threads?fromHours=24&limit=10&offset=0&sort=desc&phase=created',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards workflow activity reads to backend workflow diagnostics endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [{ id: 'evt_wf_1', event_type: 'workflow_stage_transitioned' }],
        total: 1,
        limit: 10,
        offset: 0,
      }),
    } as Response);
    const res = await getGatedEntryTelemetry(
      new Request(
        'http://localhost/api/analytics/gated-entry?eventKind=workflow_activity&fromHours=24&phase=stage_transitioned&slaState=warning&limit=10&offset=0&sort=desc',
        { headers: { Authorization: 'Bearer demo_token' } },
      ),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).items).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry/workflow-activity?fromHours=24&limit=10&offset=0&sort=desc&phase=stage_transitioned&slaState=warning',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards dashboard summary reads to backend diagnostics summary endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tenantId: 'tenant_1',
        fromHours: 24,
        totalDiagnostics: 8,
        counters: { gatedEntryAttempts: 2 },
      }),
    } as Response);
    const res = await getGatedEntryTelemetry(
      new Request('http://localhost/api/analytics/gated-entry?eventKind=dashboard_summary&fromHours=24', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).totalDiagnostics).toBe(8);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry/dashboard-summary?fromHours=24',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards actor-resolution reads to backend gated-entry actors endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        actors: { '11111111-1111-1111-1111-111111111111': 'ops@tracebud.test' },
      }),
    } as Response);

    const res = await getGatedEntryTelemetry(
      new Request('http://localhost/api/analytics/gated-entry?eventKind=actors&ids=11111111-1111-1111-1111-111111111111', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );

    expect(res.status).toBe(200);
    expect((await res.json()).actors['11111111-1111-1111-1111-111111111111']).toBe('ops@tracebud.test');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry/actors?ids=11111111-1111-1111-1111-111111111111',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('passes through backend 400 for invalid actor ids request', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'ids must be UUID values.' }),
    } as Response);

    const res = await getGatedEntryTelemetry(
      new Request('http://localhost/api/analytics/gated-entry?eventKind=actors&ids=not-a-uuid', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'ids must be UUID values.' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/audit/gated-entry/actors?ids=not-a-uuid',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards webhook registration reads to backend webhooks endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [{ id: 'evt_webhook_1', event_type: 'integration_webhook_registered' }],
        total: 1,
        limit: 10,
        offset: 0,
      }),
    } as Response);
    const res = await getGatedEntryTelemetry(
      new Request('http://localhost/api/analytics/gated-entry?eventKind=webhooks&limit=10&offset=0', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).items).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/webhooks?limit=10&offset=0',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('forwards webhook delivery reads to backend webhook deliveries endpoint', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [{ id: 'evt_delivery_1', event_type: 'integration_delivery_succeeded' }],
        total: 1,
        limit: 10,
        offset: 0,
      }),
    } as Response);
    const res = await getGatedEntryTelemetry(
      new Request(
        'http://localhost/api/analytics/gated-entry?eventKind=webhook_deliveries&webhookId=webhook_1&limit=10&offset=0',
        {
          headers: { Authorization: 'Bearer demo_token' },
        },
      ),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).items).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://backend.tracebud.test/v1/webhooks/webhook_1/deliveries?limit=10&offset=0',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
  });

  it('rejects webhook delivery reads without webhookId', async () => {
    process.env.TRACEBUD_BACKEND_URL = 'https://backend.tracebud.test';
    const res = await getGatedEntryTelemetry(
      new Request('http://localhost/api/analytics/gated-entry?eventKind=webhook_deliveries', {
        headers: { Authorization: 'Bearer demo_token' },
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'webhookId is required for webhook delivery reads.' });
  });
});

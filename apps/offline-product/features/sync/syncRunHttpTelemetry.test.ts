import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/api/runtimeGuards', () => ({
  getTracebudApiBaseUrl: () => 'https://api.tracebud.com/api',
}));

import {
  beginSyncPipelineHttpTelemetry,
  beginSyncRunHttpTelemetry,
  endSyncPipelineHttpTelemetry,
  endSyncRunHttpTelemetry,
  formatSyncRunHttpSummary,
  normalizeSyncHttpRouteLabel,
  resetSyncRunHttpTelemetryForTests,
} from './syncRunHttpTelemetry';

describe('syncRunHttpTelemetry', () => {
  beforeEach(() => {
    vi.stubGlobal('__DEV__', true);
    resetSyncRunHttpTelemetryForTests();
  });

  it('normalizes synced-evidence and audit batch routes', () => {
    expect(
      normalizeSyncHttpRouteLabel(
        'GET',
        'https://api.tracebud.com/api/v1/plots/plot-1/synced-evidence',
      ),
    ).toBe('GET /v1/plots/*/synced-evidence');
    expect(
      normalizeSyncHttpRouteLabel('POST', 'https://api.tracebud.com/api/v1/audit/batch'),
    ).toBe('POST /v1/audit/batch');
  });

  it('counts Tracebud API requests during an active dev run', async () => {
    const originalFetch = vi.fn(async () => new Response('{}', { status: 200 }));
    globalThis.fetch = originalFetch as typeof fetch;

    beginSyncPipelineHttpTelemetry();
    await fetch('https://api.tracebud.com/api/v1/audit?farmerId=f1');
    await fetch('https://api.tracebud.com/api/v1/audit/batch', { method: 'POST' });
    const summary = endSyncPipelineHttpTelemetry();

    expect(summary?.total).toBe(2);
    expect(summary?.byRoute['GET /v1/audit']).toBe(1);
    expect(summary?.byRoute['POST /v1/audit/batch']).toBe(1);
    expect(formatSyncRunHttpSummary(summary)).toContain('2 (');
  });

  it('does not count requests outside pipeline telemetry scope', async () => {
    const originalFetch = vi.fn(async () => new Response('{}', { status: 200 }));
    globalThis.fetch = originalFetch as typeof fetch;

    await fetch('https://api.tracebud.com/api/v1/plots?farmerId=f1');
    beginSyncPipelineHttpTelemetry();
    await fetch('https://api.tracebud.com/api/v1/audit/batch', { method: 'POST' });
    const summary = endSyncPipelineHttpTelemetry();

    expect(summary?.total).toBe(1);
    expect(summary?.byRoute['POST /v1/audit/batch']).toBe(1);
  });

  it('keeps deprecated session aliases wired to pipeline scope', async () => {
    const originalFetch = vi.fn(async () => new Response('{}', { status: 200 }));
    globalThis.fetch = originalFetch as typeof fetch;

    beginSyncRunHttpTelemetry();
    await fetch('https://api.tracebud.com/api/v1/harvest/vouchers/mine');
    const summary = endSyncRunHttpTelemetry();

    expect(summary?.total).toBe(1);
    expect(summary?.byRoute['GET /v1/harvest/vouchers/mine']).toBe(1);
  });
});

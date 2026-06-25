import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';

export type SyncRunHttpSummary = {
  total: number;
  byRoute: Record<string, number>;
};

/** Only counts HTTP while pipeline depth > 0 (not whole sync session / Settings refresh). */
let pipelineDepth = 0;
let originalFetch: typeof fetch | null = null;
const counts = new Map<string, number>();

function isDevRuntime(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

function readFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

/** Same grouping as backend rate-limit observability for comparable ops views. */
export function normalizeSyncHttpRouteLabel(method: string, url: string): string {
  const upperMethod = method.toUpperCase();
  let pathOnly = url;
  try {
    pathOnly = new URL(url).pathname;
  } catch {
    pathOnly = url.split('?')[0] ?? url;
  }

  const apiBase = getTracebudApiBaseUrl().replace(/\/$/, '');
  const relative = pathOnly.startsWith(apiBase)
    ? pathOnly.slice(apiBase.length)
    : pathOnly.replace(/^\/api(?=\/|$)/, '');

  if (relative.startsWith('/v1/audit/batch')) return `${upperMethod} /v1/audit/batch`;
  if (relative.startsWith('/v1/audit')) return `${upperMethod} /v1/audit`;
  if (/\/v1\/plots\/[^/]+\/synced-evidence/.test(relative)) {
    return `${upperMethod} /v1/plots/*/synced-evidence`;
  }
  if (/\/v1\/plots\/[^/]+\/tenure-verification/.test(relative)) {
    return `${upperMethod} /v1/plots/*/tenure-verification`;
  }
  if (relative.startsWith('/v1/plots')) return `${upperMethod} /v1/plots`;
  if (relative.startsWith('/v1/harvest/vouchers/mine')) {
    return `${upperMethod} /v1/harvest/vouchers/mine`;
  }
  if (relative.startsWith('/v1/harvest/vouchers')) return `${upperMethod} /v1/harvest/vouchers`;
  if (relative.startsWith('/v1/harvest')) return `${upperMethod} /v1/harvest`;
  if (relative.startsWith('/v1/me/field-sync-delta')) return `${upperMethod} /v1/me/field-sync-delta`;
  if (relative.startsWith('/v1/me/field-farmer-ids')) return `${upperMethod} /v1/me/field-farmer-ids`;

  const segments = relative.split('/').filter(Boolean);
  if (segments.length >= 2) {
    return `${upperMethod} /${segments.slice(0, 2).join('/')}`;
  }
  return `${upperMethod} ${relative || '/'}`;
}

function recordRequest(method: string, url: string): void {
  if (pipelineDepth <= 0) return;
  const apiBase = getTracebudApiBaseUrl().replace(/\/$/, '');
  if (!url.startsWith(apiBase) && !url.includes('/v1/')) {
    return;
  }
  const route = normalizeSyncHttpRouteLabel(method, url);
  counts.set(route, (counts.get(route) ?? 0) + 1);
}

function buildSummary(): SyncRunHttpSummary {
  const byRoute = Object.fromEntries(
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
  );
  const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
  return { total, byRoute };
}

function ensureFetchPatch(): void {
  if (originalFetch) return;
  originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
    recordRequest(method, readFetchUrl(input));
    return originalFetch!(input, init);
  }) as typeof fetch;
}

function releaseFetchPatchIfIdle(): void {
  if (pipelineDepth > 0 || !originalFetch) return;
  globalThis.fetch = originalFetch;
  originalFetch = null;
}

/** Count Tracebud API calls made inside {@link runFieldSyncPipeline} only. */
export function beginSyncPipelineHttpTelemetry(): void {
  if (!isDevRuntime()) return;
  if (pipelineDepth === 0) {
    counts.clear();
  }
  pipelineDepth += 1;
  ensureFetchPatch();
}

export function endSyncPipelineHttpTelemetry(): SyncRunHttpSummary | null {
  if (!isDevRuntime() || pipelineDepth <= 0) {
    return null;
  }
  pipelineDepth -= 1;
  releaseFetchPatchIfIdle();
  if (pipelineDepth > 0) {
    return null;
  }
  return buildSummary();
}

/** @deprecated Prefer beginSyncPipelineHttpTelemetry — session-wide counts include parity/metrics noise. */
export function beginSyncRunHttpTelemetry(): void {
  beginSyncPipelineHttpTelemetry();
}

/** @deprecated Prefer endSyncPipelineHttpTelemetry. */
export function endSyncRunHttpTelemetry(): SyncRunHttpSummary | null {
  return endSyncPipelineHttpTelemetry();
}

export function formatSyncRunHttpSummary(summary: SyncRunHttpSummary | null): string | null {
  if (!summary || summary.total <= 0) return null;
  const parts = Object.entries(summary.byRoute).map(([route, count]) => `${route} ${count}`);
  return `${summary.total} (${parts.join(', ')})`;
}

/** Test helper. */
export function resetSyncRunHttpTelemetryForTests(): void {
  pipelineDepth = 0;
  counts.clear();
  if (originalFetch) {
    globalThis.fetch = originalFetch;
    originalFetch = null;
  }
}

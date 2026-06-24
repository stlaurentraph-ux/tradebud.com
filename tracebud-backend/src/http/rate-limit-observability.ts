import type { Request } from 'express';

export type RateLimit429Snapshot = {
  windowStartedAt: string | null;
  total429: number;
  byRoute: Record<string, number>;
};

const WINDOW_MS = 60_000;

let windowStartedAtMs: number | null = null;
let total429 = 0;
const byRoute = new Map<string, number>();

function resetWindowIfExpired(nowMs: number): void {
  if (windowStartedAtMs == null || nowMs - windowStartedAtMs >= WINDOW_MS) {
    windowStartedAtMs = nowMs;
    total429 = 0;
    byRoute.clear();
  }
}

function readRequestUrl(req: Request): string {
  return String(req.originalUrl ?? req.url ?? '');
}

/** Stable route label for ops dashboards (method + normalized path). */
export function normalizeRateLimitRouteLabel(method: string, url: string): string {
  const upperMethod = method.toUpperCase();
  const pathOnly = url.split('?')[0] ?? url;
  const apiPath = pathOnly.replace(/^\/api(?=\/|$)/, '') || '/';

  if (apiPath.startsWith('/v1/audit/batch')) return `${upperMethod} /v1/audit/batch`;
  if (apiPath.startsWith('/v1/audit')) return `${upperMethod} /v1/audit`;
  if (/\/v1\/plots\/[^/]+\/synced-evidence/.test(apiPath)) {
    return `${upperMethod} /v1/plots/*/synced-evidence`;
  }
  if (/\/v1\/plots\/[^/]+\/tenure-verification/.test(apiPath)) {
    return `${upperMethod} /v1/plots/*/tenure-verification`;
  }
  if (apiPath.startsWith('/v1/plots')) return `${upperMethod} /v1/plots`;
  if (apiPath.startsWith('/v1/harvest/vouchers/mine')) {
    return `${upperMethod} /v1/harvest/vouchers/mine`;
  }
  if (apiPath.startsWith('/v1/harvest/vouchers')) return `${upperMethod} /v1/harvest/vouchers`;
  if (apiPath.startsWith('/v1/harvest')) return `${upperMethod} /v1/harvest`;
  if (apiPath.startsWith('/v1/me/field-sync-delta')) return `${upperMethod} /v1/me/field-sync-delta`;
  if (apiPath.startsWith('/v1/me/field-farmer-ids')) return `${upperMethod} /v1/me/field-farmer-ids`;
  if (apiPath.startsWith('/v1/me/field-app-bootstrap')) {
    return `${upperMethod} /v1/me/field-app-bootstrap`;
  }
  if (apiPath.startsWith('/health')) return `${upperMethod} /health`;

  const segments = apiPath.split('/').filter(Boolean);
  if (segments.length >= 2) {
    return `${upperMethod} /${segments.slice(0, 2).join('/')}`;
  }
  return `${upperMethod} ${apiPath || '/'}`;
}

export function recordRateLimit429(req: Request): string {
  const nowMs = Date.now();
  resetWindowIfExpired(nowMs);
  const route = normalizeRateLimitRouteLabel(req.method ?? 'GET', readRequestUrl(req));
  total429 += 1;
  byRoute.set(route, (byRoute.get(route) ?? 0) + 1);
  return route;
}

export function getRateLimit429Snapshot(): RateLimit429Snapshot {
  return {
    windowStartedAt:
      windowStartedAtMs != null ? new Date(windowStartedAtMs).toISOString() : null,
    total429,
    byRoute: Object.fromEntries(
      [...byRoute.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    ),
  };
}

/** Test helper — reset counters between unit tests. */
export function resetRateLimit429ObservabilityForTests(): void {
  windowStartedAtMs = null;
  total429 = 0;
  byRoute.clear();
}

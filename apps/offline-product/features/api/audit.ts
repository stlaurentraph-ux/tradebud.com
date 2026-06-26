/**
 * Audit and compliance API module - handles audit logging and event tracking.
 * Extracted from postPlot.ts for better separation of concerns.
 */

import { getAccessTokenFromSupabase } from './auth';
import { logError } from '@/features/errors/ErrorLogger';
import { getTracebudApiBaseUrl } from './runtimeGuards';

const API_BASE_URL = getTracebudApiBaseUrl();

/** Extract error message from NestJS-style response */
function messageFromBackendJson(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const raw = (body as { message?: unknown }).message;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'string')) {
    return raw.join(' ');
  }
  return undefined;
}

export async function fetchAuditForFarmer(farmerId: string) {
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    throw new Error('No access token available for audit log');
  }

  const res = await fetch(`${API_BASE_URL}/v1/audit?farmerId=${encodeURIComponent(farmerId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Restore/sync callers handle failures gracefully; logging here duplicated
    // once per parallel restore step and flooded Metro LogBox in dev.
    throw new Error(body.message ?? `Audit fetch error: ${res.status}`);
  }

  return res.json();
}

export type PostAuditEventResult =
  | { ok: true; id?: string; timestamp?: string; idempotent?: boolean }
  | { ok: false; reason: 'no_access_token' | 'network_error' | 'server_error'; message?: string };

export type PostAuditBatchResult =
  | {
      ok: true;
      accepted: number;
      idempotent: number;
      failed: number;
      results: PostAuditEventResult[];
    }
  | { ok: false; reason: 'no_access_token' | 'network_error' | 'server_error'; message?: string };

/**
 * Append a row to the server audit_log (e.g. declaration bundle snapshot).
 */
export async function postAuditEventToBackend(params: {
  eventType: string;
  payload: Record<string, unknown>;
  deviceId?: string | null;
  clientEventId?: string | null;
}): Promise<PostAuditEventResult> {
  let accessToken: string | null;
  try {
    accessToken = await getAccessTokenFromSupabase();
  } catch {
    accessToken = null;
  }

  if (!accessToken) {
    return { ok: false, reason: 'no_access_token' };
  }

  const clientEventId =
    typeof params.clientEventId === 'string' && params.clientEventId.trim().length > 0
      ? params.clientEventId.trim()
      : typeof params.payload.clientEventId === 'string' &&
          params.payload.clientEventId.trim().length > 0
        ? params.payload.clientEventId.trim()
        : undefined;
  const payload = clientEventId
    ? { ...params.payload, clientEventId }
    : params.payload;

  try {
    const res = await fetch(`${API_BASE_URL}/v1/audit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType: params.eventType,
        payload,
        deviceId: params.deviceId ?? undefined,
        clientEventId,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      // Queue/sync callers handle 401/429; logging here duplicated noise in dev LogBox.
      if (res.status !== 429 && res.status !== 401) {
        logError(new Error(body.message ?? `Audit POST failed (${res.status})`), {
          context: 'postAuditEvent',
          statusCode: res.status,
          eventType: params.eventType,
        });
      }
      return {
        ok: false,
        reason: 'server_error',
        message: messageFromBackendJson(body) ?? `Audit POST failed (${res.status})`,
      };
    }

    const row = (await res.json().catch(() => ({}))) as {
      id?: string;
      timestamp?: string;
      idempotent?: boolean;
    };
    return { ok: true, id: row.id, timestamp: row.timestamp, idempotent: row.idempotent };
  } catch (e) {
    logError(e as Error, {
      context: 'postAuditEvent',
      phase: 'network',
      eventType: params.eventType,
    });
    return {
      ok: false,
      reason: 'network_error',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

async function postAuditEventsSequentiallyToBackend(
  events: Array<{
    eventType: string;
    payload: Record<string, unknown>;
    deviceId?: string | null;
    clientEventId?: string | null;
  }>,
): Promise<PostAuditBatchResult> {
  const results: PostAuditEventResult[] = [];
  let accepted = 0;
  let idempotent = 0;
  let failed = 0;

  for (const event of events) {
    const row = await postAuditEventToBackend(event);
    results.push(row);
    if (!row.ok) {
      failed += 1;
      continue;
    }
    if (row.idempotent) {
      idempotent += 1;
    } else {
      accepted += 1;
    }
  }

  return { ok: true, accepted, idempotent, failed, results };
}

export async function postAuditEventsBatchToBackend(
  events: Array<{
    eventType: string;
    payload: Record<string, unknown>;
    deviceId?: string | null;
    clientEventId?: string | null;
  }>,
): Promise<PostAuditBatchResult> {
  if (events.length === 0) {
    return { ok: true, accepted: 0, idempotent: 0, failed: 0, results: [] };
  }

  let accessToken: string | null;
  try {
    accessToken = await getAccessTokenFromSupabase();
  } catch {
    accessToken = null;
  }

  if (!accessToken) {
    return { ok: false, reason: 'no_access_token' };
  }

  const normalized = events.map((event) => {
    const clientEventId =
      typeof event.clientEventId === 'string' && event.clientEventId.trim().length > 0
        ? event.clientEventId.trim()
        : typeof event.payload.clientEventId === 'string' &&
            event.payload.clientEventId.trim().length > 0
          ? event.payload.clientEventId.trim()
          : undefined;
    const payload = clientEventId
      ? { ...event.payload, clientEventId }
      : event.payload;
    return {
      eventType: event.eventType,
      payload,
      deviceId: event.deviceId ?? undefined,
      clientEventId,
    };
  });

  try {
    const res = await fetch(`${API_BASE_URL}/v1/audit/batch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events: normalized }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      // Production may not have /v1/audit/batch until backend deploy — use single POST fallback.
      if (res.status === 404) {
        return postAuditEventsSequentiallyToBackend(normalized);
      }
      if (res.status !== 429 && res.status !== 401) {
        logError(new Error(body.message ?? `Audit batch POST failed (${res.status})`), {
          context: 'postAuditEventBatch',
          statusCode: res.status,
          count: events.length,
        });
      }
      return {
        ok: false,
        reason: 'server_error',
        message: messageFromBackendJson(body) ?? `Audit batch POST failed (${res.status})`,
      };
    }

    const body = (await res.json().catch(() => ({}))) as {
      accepted?: number;
      idempotent?: number;
      failed?: number;
      results?: Array<
        | { ok: true; id?: string; timestamp?: string; idempotent?: boolean }
        | { ok: false; message?: string }
      >;
    };

    const results: PostAuditEventResult[] = (body.results ?? []).map((row) => {
      if (row && typeof row === 'object' && 'ok' in row && row.ok === false) {
        return {
          ok: false as const,
          reason: 'server_error' as const,
          message: row.message ?? 'Audit batch item failed',
        };
      }
      const okRow = row as { id?: string; timestamp?: string; idempotent?: boolean };
      return {
        ok: true as const,
        id: okRow.id,
        timestamp: okRow.timestamp,
        idempotent: okRow.idempotent,
      };
    });

    return {
      ok: true,
      accepted: Number(body.accepted ?? 0),
      idempotent: Number(body.idempotent ?? 0),
      failed: Number(body.failed ?? 0),
      results,
    };
  } catch (e) {
    logError(e as Error, {
      context: 'postAuditEventBatch',
      phase: 'network',
      count: events.length,
    });
    return {
      ok: false,
      reason: 'network_error',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Log an audit event locally or to server with graceful degradation.
 * Returns true if successful, false if offline or error.
 */
export async function logAuditEvent(
  eventType: string,
  payload: Record<string, unknown>,
  deviceId?: string | null,
): Promise<boolean> {
  try {
    const result = await postAuditEventToBackend({
      eventType,
      payload,
      deviceId,
    });
    return result.ok;
  } catch (error) {
    logError(error as Error, {
      context: 'logAuditEvent',
      eventType,
    });
    return false;
  }
}

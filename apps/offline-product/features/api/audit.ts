/**
 * Audit and compliance API module - handles audit logging and event tracking.
 * Extracted from postPlot.ts for better separation of concerns.
 */

import { getAccessTokenFromSupabase } from './auth';
import { isFarmerScopeViolationMessage } from './farmerScopeErrors';
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
    const message =
      messageFromBackendJson(body) ?? `Audit fetch error: ${res.status}`;
    const scopeViolation = res.status === 403 && isFarmerScopeViolationMessage(message);
    if (!scopeViolation) {
      logError(new Error(message), {
        context: 'fetchAudit',
        statusCode: res.status,
        farmerId,
      });
    }
    throw new Error(message);
  }

  return res.json();
}

export type PostAuditEventResult =
  | { ok: true; id?: string; timestamp?: string }
  | { ok: false; reason: 'no_access_token' | 'network_error' | 'server_error'; message?: string };

/**
 * Append a row to the server audit_log (e.g. declaration bundle snapshot).
 */
export async function postAuditEventToBackend(params: {
  eventType: string;
  payload: Record<string, unknown>;
  deviceId?: string | null;
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

  try {
    const res = await fetch(`${API_BASE_URL}/v1/audit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType: params.eventType,
        payload: params.payload,
        deviceId: params.deviceId ?? undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      logError(new Error(body.message ?? `Audit POST failed (${res.status})`), {
        context: 'postAuditEvent',
        statusCode: res.status,
        eventType: params.eventType,
      });
      return {
        ok: false,
        reason: 'server_error',
        message: messageFromBackendJson(body) ?? `Audit POST failed (${res.status})`,
      };
    }

    const row = (await res.json().catch(() => ({}))) as { id?: string; timestamp?: string };
    return { ok: true, id: row.id, timestamp: row.timestamp };
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

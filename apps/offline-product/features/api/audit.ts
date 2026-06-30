/**
 * Audit and compliance API module - handles audit logging and event tracking.
 * Extracted from postPlot.ts for better separation of concerns.
 */

import { isAuthSessionApiFailure } from '@/features/api/authSessionErrors';
import { getAccessTokenFromSupabase, forceSyncAccessTokenRefresh } from './syncAuthSession';
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

async function requestAuditForFarmer(farmerId: string, accessToken: string) {
  const res = await fetch(`${API_BASE_URL}/v1/audit?farmerId=${encodeURIComponent(farmerId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

export async function fetchAuditForFarmer(farmerId: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const accessToken = await getAccessTokenFromSupabase();
    if (!accessToken) {
      throw new Error('sign_in_session_expired');
    }

    const { res, body } = await requestAuditForFarmer(farmerId, accessToken);

    if (res.ok) {
      return body;
    }

    const message =
      messageFromBackendJson(body) ?? `Audit fetch error: ${res.status}`;
    const scopeViolation = res.status === 403 && isFarmerScopeViolationMessage(message);
    const sessionFailure = isAuthSessionApiFailure(res.status, message);

    if (sessionFailure && attempt === 0) {
      forceSyncAccessTokenRefresh();
      continue;
    }

    if (!scopeViolation && !sessionFailure) {
      logError(new Error(message), {
        context: 'fetchAudit',
        statusCode: res.status,
        farmerId,
      });
    }

    throw new Error(sessionFailure ? 'sign_in_session_expired' : message);
  }

  throw new Error('sign_in_session_expired');
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
  for (let attempt = 0; attempt < 2; attempt += 1) {
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

      if (res.ok) {
        const row = (await res.json().catch(() => ({}))) as { id?: string; timestamp?: string };
        return { ok: true, id: row.id, timestamp: row.timestamp };
      }

      const body = await res.json().catch(() => ({}));
      const message =
        messageFromBackendJson(body) ?? `Audit POST failed (${res.status})`;
      const sessionFailure = isAuthSessionApiFailure(res.status, message);

      if (sessionFailure && attempt === 0) {
        forceSyncAccessTokenRefresh();
        continue;
      }

      if (!sessionFailure) {
        logError(new Error(message), {
          context: 'postAuditEvent',
          statusCode: res.status,
          eventType: params.eventType,
        });
      }

      return {
        ok: false,
        reason: sessionFailure ? 'no_access_token' : 'server_error',
        message: sessionFailure ? 'sign_in_session_expired' : message,
      };
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

  return { ok: false, reason: 'no_access_token', message: 'sign_in_session_expired' };
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

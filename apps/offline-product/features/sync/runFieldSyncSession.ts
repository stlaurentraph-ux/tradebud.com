import {
  beginSyncAccessTokenRun,
  endSyncAccessTokenRun,
  invalidateCachedSyncAccessToken,
  verifySyncAccessToken,
  type VerifySyncAccessTokenResult,
} from '@/features/api/syncAuthSession';
import { probeSyncAccessTokenAccepted } from '@/features/network/pingTracebudApi';
import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';
import {
  beginServerPlotFetchRun,
  endServerPlotFetchRun,
} from '@/features/sync/serverPlotFetchCache';
import {
  classifyTokenVerifyFailure,
  type SyncFailure,
} from '@/features/sync/syncFailure';

export type FieldSyncSession = {
  accessToken: string;
  apiBaseUrl: string;
};

export type FieldSyncSessionOpenResult =
  | { ok: true; session: FieldSyncSession; end: () => void }
  | { ok: false; failure: SyncFailure; verify: VerifySyncAccessTokenResult };

function failureFromVerify(result: Extract<VerifySyncAccessTokenResult, { ok: false }>): SyncFailure {
  return classifyTokenVerifyFailure(result.reason);
}

/**
 * Opens a scoped sync session: one verified Supabase token + de-duplicated plot fetches.
 * Call `end()` in a finally block when the run finishes.
 */
export async function openFieldSyncSession(): Promise<FieldSyncSessionOpenResult> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const verify = await verifySyncAccessToken().catch(
      (): Extract<VerifySyncAccessTokenResult, { ok: false }> => ({
        ok: false,
        reason: 'network',
      }),
    );

    if (!verify.ok) {
      return { ok: false, failure: failureFromVerify(verify), verify };
    }

    if (await probeSyncAccessTokenAccepted(verify.token)) {
      beginServerPlotFetchRun();
      beginSyncAccessTokenRun(verify.token);

      return {
        ok: true,
        session: {
          accessToken: verify.token,
          apiBaseUrl: getTracebudApiBaseUrl(),
        },
        end: () => {
          endSyncAccessTokenRun();
          endServerPlotFetchRun();
        },
      };
    }

    if (attempt === 0) {
      invalidateCachedSyncAccessToken();
      continue;
    }

    return {
      ok: false,
      failure: failureFromVerify({ ok: false, reason: 'session_expired' }),
      verify: { ok: false, reason: 'session_expired' },
    };
  }

  return {
    ok: false,
    failure: failureFromVerify({ ok: false, reason: 'session_expired' }),
    verify: { ok: false, reason: 'session_expired' },
  };
}

/** Run work inside a field sync session; always closes the session. */
export async function withFieldSyncSession<T>(
  fn: (session: FieldSyncSession) => Promise<T>,
): Promise<{ ok: true; value: T; session: FieldSyncSession } | { ok: false; failure: SyncFailure }> {
  const opened = await openFieldSyncSession();
  if (!opened.ok) {
    return { ok: false, failure: opened.failure };
  }

  try {
    const value = await fn(opened.session);
    return { ok: true, value, session: opened.session };
  } finally {
    opened.end();
  }
}

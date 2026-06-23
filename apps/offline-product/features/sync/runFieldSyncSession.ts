import {
  beginSyncAccessTokenRun,
  endSyncAccessTokenRun,
  verifySyncAccessToken,
  type VerifySyncAccessTokenResult,
} from '@/features/api/syncAuthSession';
import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';
import {
  beginServerPlotFetchRun,
  endServerPlotFetchRun,
} from '@/features/sync/serverPlotFetchCache';
import {
  beginSyncRunHttpTelemetry,
  endSyncRunHttpTelemetry,
  type SyncRunHttpSummary,
} from '@/features/sync/syncRunHttpTelemetry';
import {
  classifyTokenVerifyFailure,
  type SyncFailure,
} from '@/features/sync/syncFailure';

export type FieldSyncSession = {
  accessToken: string;
  apiBaseUrl: string;
};

export type FieldSyncSessionOpenResult =
  | { ok: true; session: FieldSyncSession; end: () => { httpSummary: SyncRunHttpSummary | null } }
  | { ok: false; failure: SyncFailure; verify: VerifySyncAccessTokenResult };

function failureFromVerify(result: Extract<VerifySyncAccessTokenResult, { ok: false }>): SyncFailure {
  return classifyTokenVerifyFailure(result.reason);
}

/**
 * Opens a scoped sync session: one verified Supabase token + de-duplicated plot fetches.
 * Call `end()` in a finally block when the run finishes.
 */
export async function openFieldSyncSession(): Promise<FieldSyncSessionOpenResult> {
  const verify = await verifySyncAccessToken().catch(
    (): Extract<VerifySyncAccessTokenResult, { ok: false }> => ({
      ok: false,
      reason: 'network',
    }),
  );

  if (!verify.ok) {
    return { ok: false, failure: failureFromVerify(verify), verify };
  }

  beginServerPlotFetchRun();
  beginSyncAccessTokenRun(verify.token);
  beginSyncRunHttpTelemetry();

  return {
    ok: true,
    session: {
      accessToken: verify.token,
      apiBaseUrl: getTracebudApiBaseUrl(),
    },
    end: () => {
      const httpSummary = endSyncRunHttpTelemetry();
      endSyncAccessTokenRun();
      endServerPlotFetchRun();
      return { httpSummary };
    },
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

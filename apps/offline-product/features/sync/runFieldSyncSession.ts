import {
  beginSyncAccessTokenRun,
  endSyncAccessTokenRun,
  verifySyncAccessToken,
  type VerifySyncAccessTokenResult,
} from '@/features/api/syncAuthSession';
import {
  beginOwnedFarmerIdsSessionCache,
  endOwnedFarmerIdsSessionCache,
} from '@/features/api/fieldAppBootstrap';
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
  beginOwnedFarmerIdsSessionCache();

  return {
    ok: true,
    session: {
      accessToken: verify.token,
      apiBaseUrl: getTracebudApiBaseUrl(),
    },
    end: () => {
      endOwnedFarmerIdsSessionCache();
      endSyncAccessTokenRun();
      endServerPlotFetchRun();
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

import type { PendingSyncAction } from '@/features/state/persistence';
import { isLikelyNetworkError } from '@/features/network/normalizeNetworkError';

/** Where in the offline→online pipeline a sync run stopped. */
export type SyncFailureStep =
  | 'token_refresh'
  | 'api_reachability'
  | 'plot_list'
  | 'plot_upload'
  | 'photo_storage'
  | 'photo_api'
  | 'harvest'
  | 'evidence'
  | 'declaration'
  | 'queue'
  | 'unknown';

export type SyncFailureCause =
  | 'network'
  | 'auth'
  | 'forbidden'
  | 'rate_limit'
  | 'server'
  | 'validation'
  | 'missing_plot_link'
  | 'timeout'
  | 'not_signed_in'
  | 'unknown';

export type SyncFailure = {
  step: SyncFailureStep;
  cause: SyncFailureCause;
  /** Original error text — for technical details and Sentry. */
  message: string;
  httpStatus?: number;
  actionType?: PendingSyncAction['actionType'];
};

function messageText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? '');
}

function stepForActionType(
  actionType: PendingSyncAction['actionType'] | undefined,
): SyncFailureStep {
  if (actionType === 'photos_sync') return 'photo_api';
  if (actionType === 'evidence_sync') return 'evidence';
  if (actionType === 'harvest') return 'harvest';
  if (actionType === 'audit_sync') return 'declaration';
  if (actionType === 'consent_approve' || actionType === 'consent_deny' || actionType === 'consent_revoke') {
    return 'queue';
  }
  return 'queue';
}

function parseHttpStatus(message: string): number | undefined {
  const match = /\b(401|403|404|408|409|413|429|500|502|503|504)\b/.exec(message);
  return match ? Number(match[1]) : undefined;
}

function classifyCause(message: string, httpStatus?: number): SyncFailureCause {
  const m = message.toLowerCase();

  if (
    /sign_in_session_expired|session expired|no access token|unauthorized|\b401\b|jwt expired/i.test(
      message,
    )
  ) {
    return 'auth';
  }
  if (/sign in to upload|not_signed_in/i.test(m)) {
    return 'not_signed_in';
  }
  if (
    httpStatus === 403 ||
    /forbidden|farmer scope|tenant claim|another account|workspace directory/i.test(m)
  ) {
    return 'forbidden';
  }
  if (httpStatus === 429 || /too many requests|rate limit|please slow down/i.test(m)) {
    return 'rate_limit';
  }
  if (/plot not on server|upload from my plots|upload a plot to tracebud first/i.test(m)) {
    return 'missing_plot_link';
  }
  if (/geo-|invalid polygon|area discrepancy|geometry|micro.?area|overlap/i.test(m)) {
    return 'validation';
  }
  if (/timeout|timed out/i.test(m)) {
    return 'timeout';
  }
  if (isLikelyNetworkError(message)) {
    return 'network';
  }
  if (
    (httpStatus != null && httpStatus >= 500) ||
    /internal server error|server error|service unavailable/i.test(m)
  ) {
    return 'server';
  }
  return 'unknown';
}

export function classifySyncFailure(params: {
  error: unknown;
  step?: SyncFailureStep;
  actionType?: PendingSyncAction['actionType'];
}): SyncFailure {
  const message = messageText(params.error).trim() || 'Unknown sync error';
  const httpStatus = parseHttpStatus(message);
  const step =
    params.step ??
    (params.actionType ? stepForActionType(params.actionType) : 'unknown');
  const cause = classifyCause(message, httpStatus);
  return {
    step,
    cause,
    message,
    httpStatus,
    actionType: params.actionType,
  };
}

export function classifyQueueSyncFailure(params: {
  error: unknown;
  actionType?: PendingSyncAction['actionType'];
}): SyncFailure {
  const message = messageText(params.error);
  const lower = message.toLowerCase();

  if (/could not read photo|photo file missing|re-add the photo/i.test(lower)) {
    const failure = classifySyncFailure({
      error: params.error,
      step: 'photo_storage',
      actionType: params.actionType,
    });
    return { ...failure, cause: 'validation' };
  }

  if (/could not upload field photos|upload evidence|storage|signed url|bucket/i.test(lower)) {
    return classifySyncFailure({
      error: params.error,
      step: 'photo_storage',
      actionType: params.actionType,
    });
  }

  if (/photo sync error:/i.test(message) || /photos-sync/i.test(lower)) {
    return classifySyncFailure({
      error: params.error,
      step: 'photo_api',
      actionType: params.actionType,
    });
  }

  return classifySyncFailure({
    error: params.error,
    step: stepForActionType(params.actionType),
    actionType: params.actionType,
  });
}

export function classifyTokenVerifyFailure(reason: 'network' | 'session_expired' | 'missing_credentials'): SyncFailure {
  if (reason === 'network') {
    return {
      step: 'token_refresh',
      cause: 'network',
      message: 'Network request failed',
    };
  }
  return {
    step: 'token_refresh',
    cause: reason === 'missing_credentials' ? 'not_signed_in' : 'auth',
    message: reason === 'missing_credentials' ? 'No access token available' : 'sign_in_session_expired',
  };
}

export function classifyPlotListFailure(error: unknown): SyncFailure {
  return classifySyncFailure({ error, step: 'plot_list' });
}

export function classifyReachabilityFailure(error?: unknown): SyncFailure {
  const failure = classifySyncFailure({
    error: error ?? 'Network request failed',
    step: 'api_reachability',
  });
  return { ...failure, cause: 'network' };
}

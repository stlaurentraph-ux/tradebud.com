import { isLikelyNetworkError } from '@/features/network/normalizeNetworkError';

const TECHNICAL_MESSAGE =
  /internal server error|http \d{3}|plot upload failed \(\d{3}\)|unexpected token|econnrefused|socket hang up|network request failed|failed to fetch|abort/i;

function isNetworkFailureMessage(message: string): boolean {
  return isLikelyNetworkError(message);
}

/** True when the API message is for logs/Sentry, not the farmer UI. */
export function isTechnicalApiMessage(message: string | undefined | null): boolean {
  const trimmed = message?.trim();
  if (!trimmed) return true;
  if (TECHNICAL_MESSAGE.test(trimmed)) return true;
  if (trimmed.length > 160) return true;
  return false;
}

export type UserMessageSurface = 'settings' | 'default';

export type SyncActionErrorContext = {
  actionType?: string;
};

type PlotUploadErrorContext = {
  reason?: 'no_access_token' | 'network_error' | 'server_error';
  statusCode?: number;
  surface?: UserMessageSurface;
};

function surfaceKey(base: string, surface: UserMessageSurface): string {
  return surface === 'settings' ? `${base}_settings` : base;
}

function isPlotGeometryRejectionMessage(raw: string): boolean {
  return /GEO-10|invalid polygon|area discrepancy|exceeds 5%|geometry correction variance/i.test(
    raw,
  );
}

/** Farmer-facing copy for plot upload failures (plot is always kept locally). */
export function mapPlotUploadErrorMessage(
  raw: string | undefined,
  t: (key: string, params?: Record<string, string | number>) => string,
  ctx?: PlotUploadErrorContext,
): string {
  const surface = ctx?.surface ?? 'default';

  if (
    ctx?.reason === 'no_access_token' ||
    /sign_in_session_expired/i.test(raw ?? '')
  ) {
    return t('sync_session_expired_short');
  }
  if (
    ctx?.statusCode === 403 ||
    /tenant claim|forbidden|workspace directory|linked to another account/i.test(raw ?? '')
  ) {
    return t(
      surface === 'settings' ? 'plot_upload_account_error_settings' : 'plot_upload_account_error',
    );
  }
  if (
    ctx?.statusCode === 429 ||
    /too many requests|rate limit|please slow down/i.test(raw ?? '')
  ) {
    return t(
      surface === 'settings' ? 'plot_upload_rate_limited_settings' : 'plot_upload_rate_limited',
    );
  }
  if (ctx?.reason === 'network_error' || isNetworkFailureMessage(raw ?? '')) {
    return t(
      surface === 'settings' ? 'plot_upload_network_error_settings' : 'plot_upload_network_error',
    );
  }
  if (raw && isPlotGeometryRejectionMessage(raw)) {
    return t('plot_upload_geometry_rejected');
  }
  if (!raw || isTechnicalApiMessage(raw)) {
    return t(surfaceKey('plot_upload_server_error', surface));
  }
  return raw;
}

/** Farmer-facing copy for sync queue / action failures. */
export function mapSyncActionErrorMessage(
  raw: string | undefined,
  t: (key: string, params?: Record<string, string | number>) => string,
  surface: UserMessageSurface = 'default',
  _ctx?: SyncActionErrorContext,
): string {
  const trimmed = raw?.trim() ?? '';

  if (/session expired|401|unauthorized|jwt|sign in again|sign_in_session_expired/i.test(trimmed)) {
    return t('sync_session_expired_short');
  }
  if (/no access token available/i.test(trimmed)) {
    return t('sync_session_expired_short');
  }
  if (/403|forbidden|farmer scope violation|another account|tenant claim|workspace directory/i.test(trimmed)) {
    return t(surfaceKey('plot_upload_account_error', surface));
  }
  if (/plot not on server/i.test(trimmed.toLowerCase())) {
    return trimmed;
  }
  if (/upload a plot to tracebud first/i.test(trimmed)) {
    return trimmed;
  }
  if (/too many requests|rate limit|please slow down/i.test(trimmed)) {
    return t(
      surface === 'settings' ? 'plot_upload_rate_limited_settings' : 'plot_upload_rate_limited',
    );
  }
  if (isNetworkFailureMessage(trimmed)) {
    return t(
      surface === 'settings' ? 'settings_sync_reach_failed' : surfaceKey('plot_upload_network_error', surface),
    );
  }
  if (!trimmed || isTechnicalApiMessage(trimmed)) {
    return t(
      surface === 'settings' ? 'settings_sync_online_server_busy' : surfaceKey('sync_action_failed_generic', surface),
    );
  }
  return trimmed;
}

/** Sync timed out or background backup exceeded its budget. */
export function syncTimedOutMessage(
  t: (key: string, params?: Record<string, string | number>) => string,
  surface: UserMessageSurface = 'default',
): string {
  return t(surfaceKey('sync_failed_try_later', surface));
}

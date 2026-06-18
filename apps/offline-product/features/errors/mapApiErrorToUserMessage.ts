const TECHNICAL_MESSAGE =
  /internal server error|http \d{3}|plot upload failed \(\d{3}\)|unexpected token|econnrefused|socket hang up|network request failed|failed to fetch|abort/i;

function isNetworkFailureMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('network request failed') ||
    m.includes('failed to fetch') ||
    m.includes('network error') ||
    m.includes('abort') ||
    m.includes('timeout') ||
    m.includes('unreachable')
  );
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
    ctx?.statusCode === 403 ||
    /tenant claim|forbidden|workspace directory|linked to another account/i.test(raw ?? '')
  ) {
    return t(
      surface === 'settings' ? 'plot_upload_account_error_settings' : 'plot_upload_account_error',
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
): string {
  if (!raw || isTechnicalApiMessage(raw) || isNetworkFailureMessage(raw)) {
    return t(surfaceKey('sync_action_failed_generic', surface));
  }
  return raw;
}

/** Sync timed out or background backup exceeded its budget. */
export function syncTimedOutMessage(
  t: (key: string, params?: Record<string, string | number>) => string,
  surface: UserMessageSurface = 'default',
): string {
  return t(surfaceKey('sync_failed_try_later', surface));
}

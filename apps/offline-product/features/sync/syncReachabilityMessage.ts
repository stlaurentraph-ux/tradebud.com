import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';
import { isLocalLanSyncApi } from '@/features/dev/syncApiTarget';
import { isLikelyNetworkError } from '@/features/network/normalizeNetworkError';

export function isNetworkReachabilityFailure(message: string): boolean {
  return isLikelyNetworkError(message);
}

/** One user-facing block when the Tracebud API cannot be reached (no duplicate plot/queue lines). */
export function buildUnreachableSyncMessage(
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  return resolveSyncConnectivityUserMessage(t);
}

/** Farmer-facing copy when sync/backup cannot reach the configured API. */
export function resolveSyncConnectivityUserMessage(
  t: (key: string, params?: Record<string, string | number>) => string,
  apiBaseUrl: string = getTracebudApiBaseUrl(),
): string {
  if (isLocalLanSyncApi(apiBaseUrl)) {
    return t('settings_sync_local_dev_unreachable', { api: apiBaseUrl });
  }
  return t('settings_sync_reach_failed');
}

/** Short line after Sync now when transport to the configured API failed. */
export function resolveSyncReachFailedShortMessage(
  t: (key: string, params?: Record<string, string | number>) => string,
  apiBaseUrl: string = getTracebudApiBaseUrl(),
): string {
  if (isLocalLanSyncApi(apiBaseUrl)) {
    return t('sync_local_dev_unreachable_short');
  }
  return t('sync_reach_failed_short');
}

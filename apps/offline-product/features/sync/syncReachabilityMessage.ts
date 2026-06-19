import { getTracebudApiBaseUrl } from '@/features/api/postPlot';

import { isLikelyNetworkError } from '@/features/network/normalizeNetworkError';

export function isNetworkReachabilityFailure(message: string): boolean {
  return isLikelyNetworkError(message);
}

/** One user-facing block when the Tracebud API cannot be reached (no duplicate plot/queue lines). */
export function buildUnreachableSyncMessage(
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  return [t('backend_unreachable'), `${t('settings_api_base')}: ${getTracebudApiBaseUrl()}`].join('\n');
}

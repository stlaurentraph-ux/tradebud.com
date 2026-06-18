import { getTracebudApiBaseUrl } from '@/features/api/postPlot';

export function isNetworkReachabilityFailure(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('network request failed') ||
    m.includes('failed to fetch') ||
    m.includes('network error') ||
    m.includes('abort') ||
    m.includes('timeout') ||
    m.includes('could not reach') ||
    m.includes("couldn't reach") ||
    m.includes('unreachable')
  );
}

/** One user-facing block when the Tracebud API cannot be reached (no duplicate plot/queue lines). */
export function buildUnreachableSyncMessage(
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  return [t('backend_unreachable'), `${t('settings_api_base')}: ${getTracebudApiBaseUrl()}`].join('\n');
}

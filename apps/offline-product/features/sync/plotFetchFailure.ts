import { isLikelyNetworkError } from '@/features/network/normalizeNetworkError';

export function plotFetchFailureMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function isPlotFetchAuthFailure(error: unknown): boolean {
  const message = plotFetchFailureMessage(error).toLowerCase();
  return (
    message.includes('no access token') ||
    message.includes('sign_in_session_expired') ||
    message.includes('unauthorized') ||
    message.includes('invalid token') ||
    message.includes('missing bearer') ||
    /\b401\b/.test(message) ||
    message.includes('jwt')
  );
}

export function isPlotFetchReachabilityFailure(error: unknown): boolean {
  return isLikelyNetworkError(plotFetchFailureMessage(error));
}

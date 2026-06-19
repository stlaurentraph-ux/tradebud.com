/** True when a thrown message usually means the device could not reach a server. */
export function isLikelyNetworkError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('network request failed') ||
    m.includes('failed to fetch') ||
    m.includes('network error') ||
    m.includes('typeerror') ||
    m.includes('abort') ||
    m.includes('timeout') ||
    m.includes('could not reach') ||
    m.includes("couldn't reach") ||
    m.includes('unreachable') ||
    m.includes('connection')
  );
}

/** Normalize fetch / RN transport failures to a stable queue + UI message. */
export function normalizeNetworkError(error: unknown): Error {
  if (error instanceof Error) {
    if (isLikelyNetworkError(error.message)) {
      return new Error('Network request failed');
    }
    return error;
  }
  return new Error('Network request failed');
}

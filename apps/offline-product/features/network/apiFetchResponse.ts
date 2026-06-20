/** Headers that discourage conditional GET (304) on React Native fetch. */
export const TRACEBUD_NO_CACHE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
};

/** Append a cache-bust query param — RN fetch ignores `cache: 'no-store'` on some builds. */
export function cacheBustUrl(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_=${Date.now()}`;
}

/** True for 2xx and 304 Not Modified (cached GET still means the API responded). */
export function isSuccessfulApiResponse(status: number): boolean {
  return (status >= 200 && status <= 299) || status === 304;
}

/**
 * RN `fetch` + `AbortController` can false-abort on device; race without aborting instead.
 * Returns null on timeout or transport failure.
 */
export async function tracebudFetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15_000,
): Promise<Response | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      fetch(url, init),
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
    return response;
  } catch {
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/** @deprecated Prefer cacheBustUrl + TRACEBUD_NO_CACHE_HEADERS */
export const API_FETCH_NO_CACHE: RequestInit = {
  headers: TRACEBUD_NO_CACHE_HEADERS,
};

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

/** @deprecated Prefer cacheBustUrl + TRACEBUD_NO_CACHE_HEADERS */
export const API_FETCH_NO_CACHE: RequestInit = {
  headers: TRACEBUD_NO_CACHE_HEADERS,
};

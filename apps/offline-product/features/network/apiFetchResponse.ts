/** Avoid conditional GET (304) breaking `response.ok` checks in React Native fetch. */
export const API_FETCH_NO_CACHE: RequestInit = { cache: 'no-store' };

/** True for 2xx and 304 Not Modified (cached GET still means the API is reachable). */
export function isSuccessfulApiResponse(status: number): boolean {
  return (status >= 200 && status <= 299) || status === 304;
}

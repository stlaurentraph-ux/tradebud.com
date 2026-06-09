const ACCESS_TOKEN_KEY = 'tracebud_token';
const REFRESH_TOKEN_KEY = 'tracebud_refresh_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken?: string | null): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasSupabaseSessionTokens(): boolean {
  return Boolean(getAccessToken() && getRefreshToken());
}

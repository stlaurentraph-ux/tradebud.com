/** Default deep link when no app_redirect query param (native / universal-link fallback). */
export const DEFAULT_FIELD_APP_DEEP_LINK = 'tracebudoffline://auth/callback';

export function parseHashParams(hash: string): Record<string, string> {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!normalized) return {};
  return Object.fromEntries(new URLSearchParams(normalized).entries());
}

export function resolveAppRedirect(appRedirect: string | null): string {
  const trimmed = appRedirect?.trim();
  if (!trimmed) return DEFAULT_FIELD_APP_DEEP_LINK;
  return trimmed;
}

/**
 * Merge Supabase OAuth query/hash params onto the field-app deep link.
 */
export function buildForwardedAuthUrl(input: {
  appRedirect: string;
  searchParams: URLSearchParams;
  hashParams: Record<string, string>;
}): string {
  const target = new URL(input.appRedirect);

  const error = input.searchParams.get('error') ?? input.hashParams.error;
  const errorDescription =
    input.searchParams.get('error_description') ?? input.hashParams.error_description;
  if (error) {
    target.searchParams.set('error', error);
    if (errorDescription) target.searchParams.set('error_description', errorDescription);
    return target.toString();
  }

  const code = input.searchParams.get('code');
  if (code) {
    target.searchParams.set('code', code);
    return target.toString();
  }

  if (input.hashParams.access_token && input.hashParams.refresh_token) {
    const hash = new URLSearchParams(input.hashParams).toString();
    target.hash = hash;
    return target.toString();
  }

  throw new Error('auth_incomplete');
}

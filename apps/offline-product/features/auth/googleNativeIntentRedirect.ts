import { isGoogleNativeOAuthRedirectUrl } from '@/features/auth/oauthCallbackUrlPolicy';

/** Map Android/iOS Google native OAuth return URLs to an in-app expo-router path. */
export function resolveGoogleNativeOAuthRouterPath(path: string): string | null {
  if (!isGoogleNativeOAuthRedirectUrl(path)) return null;

  try {
    const url = new URL(path, 'tracebudoffline://app');
    const query = url.search;
    return query ? `/oauth2redirect${query}` : '/oauth2redirect';
  } catch {
    const queryIndex = path.indexOf('?');
    if (queryIndex >= 0) {
      return `/oauth2redirect${path.slice(queryIndex)}`;
    }
    return '/oauth2redirect';
  }
}

/** Rewrite third-party native intents before expo-router matches routes. */
export function redirectSystemPathForNativeIntent(path: string): string {
  const googlePath = resolveGoogleNativeOAuthRouterPath(path);
  if (googlePath) return googlePath;

  if (path.includes('#')) {
    return path.replace('#', '?');
  }

  return path;
}

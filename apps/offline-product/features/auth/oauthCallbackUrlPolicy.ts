/**
 * True when a URL is a Tracebud/Supabase OAuth callback — not Google native oauth2redirect.
 */
export function isGoogleNativeOAuthRedirectUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('oauth2redirect') || lower.includes('googleusercontent.apps');
}

export function extractGoogleNativeOAuthCode(url: string): string | null {
  if (!isGoogleNativeOAuthRedirectUrl(url)) return null;
  try {
    const parsed = new URL(url, 'https://phony.example');
    const code = parsed.searchParams.get('code');
    return code && code.length > 0 ? code : null;
  } catch {
    return null;
  }
}

export function isOAuthCallbackUrl(url: string): boolean {
  if (isGoogleNativeOAuthRedirectUrl(url)) {
    return false;
  }
  if (url.includes('auth/callback') || url.includes('app.tracebud.com/auth/')) {
    return true;
  }
  if (url.includes('access_token=') || url.includes('error=')) {
    return true;
  }
  if (url.includes('code=')) {
    return (
      url.includes('auth/callback') ||
      url.includes('app.tracebud.com') ||
      url.includes('tracebudoffline://')
    );
  }
  return false;
}

/**
 * True when a URL is a Tracebud/Supabase OAuth callback — not Google native oauth2redirect.
 */
export function isOAuthCallbackUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes('oauth2redirect') || lower.includes('googleusercontent.apps')) {
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

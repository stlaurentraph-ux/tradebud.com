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

/** Custom app scheme used for native OAuth deep links. */
const APP_DEEP_LINK_SCHEME = 'tracebudoffline://';

/** Hosts we trust to deliver OAuth tokens/codes over HTTPS (the field-auth bridge / universal link). */
function allowedHttpsCallbackHosts(): Set<string> {
  const hosts = new Set<string>(['app.tracebud.com']);
  // Preview/staging builds may point the OAuth bridge at a different host.
  const override = process.env.EXPO_PUBLIC_OAUTH_BRIDGE_URL?.trim();
  if (override) {
    try {
      hosts.add(new URL(override).hostname.toLowerCase());
    } catch {
      /* ignore malformed override */
    }
  }
  return hosts;
}

/**
 * A deep link may only be treated as an OAuth callback if it originates from a trusted scheme/host.
 * Without this gate, ANY app could deep-link `evil://x?access_token=…&refresh_token=…` and the
 * orchestrator would call `supabase.auth.setSession` with attacker-supplied tokens (session
 * fixation / account takeover). We therefore validate the origin BEFORE looking at any params.
 */
function isTrustedOAuthCallbackOrigin(url: string): boolean {
  const lower = url.toLowerCase();
  // Native custom scheme: tracebudoffline://auth/callback...
  if (lower.startsWith(APP_DEEP_LINK_SCHEME)) return true;
  // Expo Go / dev client bridge target: exp://<host>/--/auth/callback...
  if (lower.startsWith('exp://') && lower.includes('auth/callback')) return true;
  // HTTPS universal link / bridge on an allowlisted host.
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' && allowedHttpsCallbackHosts().has(parsed.hostname.toLowerCase())) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function isOAuthCallbackUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) {
    return false;
  }
  if (isGoogleNativeOAuthRedirectUrl(url)) {
    return false;
  }
  // Reject token/code/error-bearing URLs from untrusted schemes/hosts up front.
  if (!isTrustedOAuthCallbackOrigin(url)) {
    return false;
  }
  const lower = url.toLowerCase();
  if (lower.includes('auth/callback')) {
    return true;
  }
  if (
    lower.includes('access_token=') ||
    lower.includes('error=') ||
    lower.includes('code=')
  ) {
    return true;
  }
  return false;
}

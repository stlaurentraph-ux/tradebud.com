/**
 * Rewrites tracebudoffline:// and Google native OAuth deep links before expo-router matches them.
 * Keep import-free — expo-router loads this module at deep-link bootstrap time.
 */
function rewriteGoogleNativeOAuth(path: string): string | null {
  const lower = path.toLowerCase();
  if (!lower.includes('oauth2redirect') && !lower.includes('googleusercontent.apps')) {
    return null;
  }
  if (lower.includes('auth/callback')) {
    return null;
  }

  const queryIndex = path.indexOf('?');
  return queryIndex >= 0 ? `/oauth2redirect${path.slice(queryIndex)}` : '/oauth2redirect';
}

function rewriteTracebudDeepLink(path: string): string | null {
  if (!path || typeof path !== 'string') return null;

  const googleNative = rewriteGoogleNativeOAuth(path);
  if (googleNative) return googleNative;

  const lower = path.toLowerCase();
  if (!lower.includes('://')) return null;
  if (!lower.startsWith('tracebudoffline://') && !lower.startsWith('tracebudoffline:/')) {
    return null;
  }

  try {
    const normalized = path.replace(/^tracebudoffline:\/(?!\/)/, 'tracebudoffline://');
    const url = new URL(normalized);
    if (url.protocol !== 'tracebudoffline:') return null;

    let route = '';
    if (url.host) {
      route = `/${url.host}${url.pathname === '/' ? '' : url.pathname}`;
    } else {
      route = url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`;
    }

    const query = url.search || '';
    const hashQuery = url.hash ? url.hash.replace('#', '?') : '';
    return `${route}${query || hashQuery}`;
  } catch {
    if (lower.includes('oauth2redirect')) {
      const queryIndex = path.indexOf('?');
      return queryIndex >= 0 ? `/oauth2redirect${path.slice(queryIndex)}` : '/oauth2redirect';
    }
    if (lower.includes('auth/callback')) {
      const queryIndex = path.indexOf('?');
      return queryIndex >= 0 ? `/auth/callback${path.slice(queryIndex)}` : '/auth/callback';
    }
    return null;
  }
}

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  if (!path || typeof path !== 'string') {
    return '/';
  }

  try {
    const rewritten = rewriteTracebudDeepLink(path);
    if (rewritten) return rewritten;

    if (path.includes('#')) {
      return path.replace('#', '?');
    }

    return path;
  } catch {
    return '/';
  }
}

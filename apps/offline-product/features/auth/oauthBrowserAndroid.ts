import * as Linking from 'expo-linking';
import { AppState, type AppStateStatus } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { deliverOAuthCallbackUrl } from '@/features/auth/oauthCallbackBridge';

const OAUTH_WAIT_MS = 120_000;

function redirectBase(url: string): string {
  return url.split('?')[0].split('#')[0];
}

/** Match tracebudoffline://auth/callback, HTTPS bridge, and path variants. */
export function oauthRedirectUrlMatches(url: string, redirectPrefix: string): boolean {
  if (!url || !redirectPrefix) return false;
  const target = redirectBase(redirectPrefix);
  const incoming = redirectBase(url);
  if (incoming.startsWith(target)) return true;
  // tracebudoffline:/auth/callback vs tracebudoffline://auth/callback
  if (incoming.replace('://', ':///').startsWith(target.replace('://', ':///'))) {
    return true;
  }
  // HTTPS bridge forwards to tracebudoffline://auth/callback after sign-in.
  if (
    target.includes('app.tracebud.com') &&
    incoming.startsWith('tracebudoffline://') &&
    incoming.includes('auth/callback')
  ) {
    return true;
  }
  return false;
}

export function oauthRedirectUrlMatchesAny(url: string, redirectPrefixes: string[]): boolean {
  return redirectPrefixes.some((prefix) => oauthRedirectUrlMatches(url, prefix));
}

/**
 * Android openAuthSessionAsync polyfill races AppState vs Linking and can load Metro inside
 * Chrome Custom Tabs. Wait on Linking + resume polls instead.
 */
export async function openOAuthBrowserOnAndroid(
  authUrl: string,
  redirectPrefixes: string | string[],
): Promise<string> {
  const prefixes = Array.isArray(redirectPrefixes) ? redirectPrefixes : [redirectPrefixes];
  let linkingSubscription: { remove: () => void } | null = null;
  let appStateSubscription: { remove: () => void } | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let settled = false;

  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      finish(() => reject(new Error('sign_in_oauth_timeout')));
    }, OAUTH_WAIT_MS);

    const finish = (handler: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (pollTimer) clearInterval(pollTimer);
      linkingSubscription?.remove();
      appStateSubscription?.remove();
      void WebBrowser.dismissBrowser();
      handler();
    };

    const tryDeliver = (url: string | null) => {
      if (!url || !oauthRedirectUrlMatchesAny(url, prefixes)) return false;
      deliverOAuthCallbackUrl(url);
      finish(() => resolve(url));
      return true;
    };

    linkingSubscription = Linking.addEventListener('url', (event) => {
      tryDeliver(event.url);
    });

    appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state !== 'active') return;
      void Linking.getInitialURL().then((url) => tryDeliver(url));
    });

    pollTimer = setInterval(() => {
      void Linking.getInitialURL().then((url) => tryDeliver(url));
    }, 400);

    void WebBrowser.openBrowserAsync(authUrl, { showInRecents: true }).catch((error) => {
      finish(() =>
        reject(error instanceof Error ? error : new Error('sign_in_oauth_failed')),
      );
    });
  });
}

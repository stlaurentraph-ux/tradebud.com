import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import {
  extractGoogleNativeOAuthCode,
  isGoogleNativeOAuthRedirectUrl,
} from '@/features/auth/oauthCallbackUrlPolicy';

const OAUTH_WAIT_MS = 120_000;

/**
 * Android auth-session polyfill races AppState vs Linking and can leave Chrome Custom Tabs
 * loading the Metro bundle on tracebudoffline:// returns. Wait on Linking only instead.
 */
export async function promptGoogleAuthCodeOnAndroid(
  authUrl: string,
  redirectUri: string,
): Promise<string> {
  const subscription = {
    current: null as ReturnType<typeof Linking.addEventListener> | null,
  };
  let settled = false;

  const codePromise = new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      subscription.current?.remove();
      void WebBrowser.dismissBrowser();
      reject(new Error('sign_in_oauth_timeout'));
    }, OAUTH_WAIT_MS);

    const finish = (handler: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      subscription.current?.remove();
      void WebBrowser.dismissBrowser();
      handler();
    };

    subscription.current = Linking.addEventListener('url', (event) => {
      if (!isGoogleNativeOAuthRedirectUrl(event.url)) return;
      if (!event.url.startsWith(redirectUri)) return;

      try {
        const parsed = new URL(event.url, 'tracebudoffline://app');
        const oauthError = parsed.searchParams.get('error');
        if (oauthError === 'access_denied') {
          finish(() => reject(new Error('sign_in_oauth_cancelled')));
          return;
        }
        if (oauthError) {
          finish(() => reject(new Error('sign_in_oauth_failed')));
          return;
        }
      } catch {
        finish(() => reject(new Error('sign_in_oauth_failed')));
        return;
      }

      const code = extractGoogleNativeOAuthCode(event.url);
      if (!code) {
        finish(() => reject(new Error('sign_in_oauth_failed')));
        return;
      }
      finish(() => resolve(code));
    });
  });

  try {
    await WebBrowser.openBrowserAsync(authUrl, { showInRecents: true });
    return await codePromise;
  } finally {
    subscription.current?.remove();
    void WebBrowser.dismissBrowser();
  }
}

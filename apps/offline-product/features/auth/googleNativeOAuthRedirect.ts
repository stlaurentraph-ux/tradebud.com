import * as Linking from 'expo-linking';

import { dismissOAuthBrowserIfOpen } from '@/features/auth/dismissOAuthBrowser';
import { extractGoogleNativeOAuthCode } from '@/features/auth/oauthCallbackUrlPolicy';

type GoogleNativeRedirectCapture = {
  waitForCode: (maxMs?: number) => Promise<string | null>;
  cancel: () => void;
};

/** Capture oauth2redirect while native Google promptAsync is in flight (Android task split). */
export function captureGoogleNativeOAuthCode(): GoogleNativeRedirectCapture {
  let capturedCode: string | null = null;
  let resolveWait: ((code: string | null) => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const finish = (code: string | null) => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (resolveWait) {
      const resolve = resolveWait;
      resolveWait = null;
      resolve(code);
    }
  };

  const subscription = Linking.addEventListener('url', (event) => {
    const code = extractGoogleNativeOAuthCode(event.url);
    if (!code) return;
    void dismissOAuthBrowserIfOpen();
    capturedCode = code;
    finish(code);
  });

  const cancel = () => {
    subscription.remove();
    finish(capturedCode);
  };

  const waitForCode = async (maxMs = 20_000): Promise<string | null> => {
    if (capturedCode) return capturedCode;

    const initial = await Linking.getInitialURL();
    const initialCode = initial ? extractGoogleNativeOAuthCode(initial) : null;
    if (initialCode) {
      void dismissOAuthBrowserIfOpen();
      capturedCode = initialCode;
      return initialCode;
    }

    return new Promise<string | null>((resolve) => {
      resolveWait = resolve;
      timer = setTimeout(() => finish(capturedCode), maxMs);
    });
  };

  return { waitForCode, cancel };
}

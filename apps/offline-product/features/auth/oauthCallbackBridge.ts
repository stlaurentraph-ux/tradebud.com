import * as Linking from 'expo-linking';

import { isOAuthCallbackUrl } from '@/features/auth/oauthCallbackUrl';

type OAuthWaiter = {
  resolve: (url: string) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

let activeWaiter: OAuthWaiter | null = null;

function clearOAuthWaiter() {
  if (!activeWaiter) return;
  clearTimeout(activeWaiter.timer);
  activeWaiter = null;
}

/** Register a waiter while an OAuth browser / native flow is in flight. */
export function beginOAuthCallbackWait(timeoutMs = 120_000): Promise<string> {
  clearOAuthWaiter();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      clearOAuthWaiter();
      reject(new Error('sign_in_oauth_timeout'));
    }, timeoutMs);
    activeWaiter = { resolve, reject, timer };
  });
}

export function cancelOAuthCallbackWait(reason = 'sign_in_oauth_cancelled') {
  if (!activeWaiter) return;
  activeWaiter.reject(new Error(reason));
  clearOAuthWaiter();
}

/** Clear an in-flight waiter without treating it as user cancellation. */
export function endOAuthCallbackWait() {
  clearOAuthWaiter();
}

/** Deliver a callback URL to an in-flight OAuth flow. Returns true when consumed. */
export function deliverOAuthCallbackUrl(url: string): boolean {
  if (!isOAuthCallbackUrl(url) || !activeWaiter) return false;
  activeWaiter.resolve(url);
  clearOAuthWaiter();
  return true;
}

/** Poll for a callback URL after iOS dismisses the auth session (deep link may arrive late). */
export async function resolveOAuthCallbackAfterDismiss(
  callbackWait: Promise<string>,
  maxMs = 20_000,
): Promise<string | null> {
  const delayedInitial = (async () => {
    for (const delayMs of [250, 500, 1000, 2000, 4000]) {
      await new Promise((r) => setTimeout(r, delayMs));
      const initial = await Linking.getInitialURL();
      if (initial && isOAuthCallbackUrl(initial)) return initial;
    }
    return null;
  })();

  const timedOut = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), maxMs);
  });

  const raced = await Promise.race([callbackWait, delayedInitial, timedOut]);
  return raced;
}

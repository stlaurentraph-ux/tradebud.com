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

/** Register a waiter while an OAuth browser session is in flight. */
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

/** Deliver a callback URL to an in-flight OAuth browser flow. */
export function deliverOAuthDeepLink(url: string): boolean {
  if (!isOAuthCallbackUrl(url) || !activeWaiter) return false;
  activeWaiter.resolve(url);
  clearOAuthWaiter();
  return true;
}

/** @deprecated Use deliverOAuthDeepLink */
export const deliverOAuthCallbackUrl = deliverOAuthDeepLink;

export function hasActiveOAuthCallbackWaiter(): boolean {
  return activeWaiter != null;
}

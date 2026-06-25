import * as Linking from 'expo-linking';

import { isOAuthCallbackUrl } from '@/features/auth/oauthCallbackUrl';
import { isOAuthLaunchExpected } from '@/features/auth/oauthLaunchExpectation';
import type { OAuthColdStartResult } from '@/features/auth/oauthOrchestrator';

export const OAUTH_CALLBACK_INTERMEDIARY_TIMEOUT_MS = 4_000;

/** Brief wait for a late OAuth URL when Android restored /auth/callback without one. */
export const STALE_OAUTH_CALLBACK_REDIRECT_MS = 200;

export type OAuthColdStartLaunchKind = 'probing' | 'oauth_return' | 'stale_restored_route';

function isOAuthColdStartUrl(url: string | null | undefined): url is string {
  return Boolean(url && isOAuthCallbackUrl(url));
}

/**
 * Distinguish a real OAuth return from a stale restored /auth/callback route (launcher open).
 * Launcher opens never deliver an OAuth URL; OAuth returns may arrive a few ms after mount.
 */
export async function probeOAuthColdStartLaunchKind(): Promise<
  Exclude<OAuthColdStartLaunchKind, 'probing'>
> {
  const initial = await Linking.getInitialURL();
  if (isOAuthColdStartUrl(initial)) {
    return 'oauth_return';
  }

  if (!(await isOAuthLaunchExpected())) {
    return 'stale_restored_route';
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (kind: Exclude<OAuthColdStartLaunchKind, 'probing'>) => {
      if (settled) return;
      settled = true;
      subscription.remove();
      clearTimeout(timer);
      resolve(kind);
    };

    const subscription = Linking.addEventListener('url', (event) => {
      if (isOAuthColdStartUrl(event.url)) {
        finish('oauth_return');
      }
    });

    const timer = setTimeout(() => {
      void Linking.getInitialURL().then((url) => {
        finish(isOAuthColdStartUrl(url) ? 'oauth_return' : 'stale_restored_route');
      });
    }, STALE_OAUTH_CALLBACK_REDIRECT_MS);
  });
}

export type OAuthColdStartLaunchPlan =
  | { action: 'wait_for_bootstrap' }
  | { action: 'run_cold_start' };

/** Wait for SQLite boot before reading OAuth cold-start state. */
export function planOAuthColdStartLaunch(input: { isAppReady: boolean }): OAuthColdStartLaunchPlan {
  if (!input.isAppReady) {
    return { action: 'wait_for_bootstrap' };
  }
  return { action: 'run_cold_start' };
}

/** Leave the intermediary /auth/callback screen — OAuth already finished or route is stale. */
export function shouldExitOAuthIntermediaryScreen(outcome: OAuthColdStartResult): boolean {
  return (
    outcome.status === 'delivered_to_waiter' ||
    outcome.status === 'already_signed_in' ||
    outcome.status === 'exit_to_home' ||
    outcome.status === 'completed'
  );
}

import type { OAuthColdStartResult } from '@/features/auth/oauthOrchestrator';

export const OAUTH_CALLBACK_INTERMEDIARY_TIMEOUT_MS = 12_000;

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

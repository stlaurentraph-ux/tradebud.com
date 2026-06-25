import { describe, expect, it } from 'vitest';

import {
  OAUTH_CALLBACK_INTERMEDIARY_TIMEOUT_MS,
  planOAuthColdStartLaunch,
  shouldExitOAuthIntermediaryScreen,
} from './oauthColdStartLaunch';

describe('oauthColdStartLaunch', () => {
  it('waits for app bootstrap before cold-start OAuth', () => {
    expect(planOAuthColdStartLaunch({ isAppReady: false })).toEqual({
      action: 'wait_for_bootstrap',
    });
    expect(planOAuthColdStartLaunch({ isAppReady: true })).toEqual({
      action: 'run_cold_start',
    });
  });

  it('exits intermediary screen for stale or completed OAuth', () => {
    expect(
      shouldExitOAuthIntermediaryScreen({ status: 'already_signed_in' }),
    ).toBe(true);
    expect(
      shouldExitOAuthIntermediaryScreen({ status: 'delivered_to_waiter' }),
    ).toBe(true);
    expect(
      shouldExitOAuthIntermediaryScreen({
        status: 'exit_to_home',
        reason: 'missing_initial_url',
      }),
    ).toBe(true);
    expect(
      shouldExitOAuthIntermediaryScreen({
        status: 'completed',
        result: { ok: true },
      }),
    ).toBe(true);
    expect(
      shouldExitOAuthIntermediaryScreen({ status: 'failed', message: 'sign_in_oauth_failed' }),
    ).toBe(false);
  });

  it('uses a bounded intermediary timeout', () => {
    expect(OAUTH_CALLBACK_INTERMEDIARY_TIMEOUT_MS).toBeGreaterThanOrEqual(8_000);
    expect(OAUTH_CALLBACK_INTERMEDIARY_TIMEOUT_MS).toBeLessThanOrEqual(20_000);
  });
});

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  OAUTH_CALLBACK_INTERMEDIARY_TIMEOUT_MS,
  STALE_OAUTH_CALLBACK_REDIRECT_MS,
  planOAuthColdStartLaunch,
  probeOAuthColdStartLaunchKind,
  shouldExitOAuthIntermediaryScreen,
} from './oauthColdStartLaunch';

const linkingMocks = vi.hoisted(() => ({
  getInitialURL: vi.fn<() => Promise<string | null>>(),
  addEventListener: vi.fn(),
}));

vi.mock('@/features/auth/oauthLaunchExpectation', () => ({
  isOAuthLaunchExpected: vi.fn(async () => false),
}));

vi.mock('expo-linking', () => ({
  getInitialURL: linkingMocks.getInitialURL,
  addEventListener: linkingMocks.addEventListener,
}));

vi.mock('@/features/auth/oauthCallbackUrl', () => ({
  isOAuthCallbackUrl: (url: string) =>
    url.includes('auth/callback') || url.includes('tracebudoffline://'),
}));

describe('oauthColdStartLaunch', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    linkingMocks.getInitialURL.mockReset();
    linkingMocks.addEventListener.mockReset();
    linkingMocks.addEventListener.mockReturnValue({ remove: vi.fn() });
    const { isOAuthLaunchExpected } = await import('@/features/auth/oauthLaunchExpectation');
    vi.mocked(isOAuthLaunchExpected).mockResolvedValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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
    expect(OAUTH_CALLBACK_INTERMEDIARY_TIMEOUT_MS).toBeGreaterThanOrEqual(3_000);
    expect(OAUTH_CALLBACK_INTERMEDIARY_TIMEOUT_MS).toBeLessThanOrEqual(6_000);
  });

  it('detects oauth return from initial URL immediately', async () => {
    linkingMocks.getInitialURL.mockResolvedValue('tracebudoffline://auth/callback?code=abc');
    await expect(probeOAuthColdStartLaunchKind()).resolves.toBe('oauth_return');
  });

  it('treats restored callback route without URL as stale immediately when OAuth is not expected', async () => {
    linkingMocks.getInitialURL.mockResolvedValue(null);
    await expect(probeOAuthColdStartLaunchKind()).resolves.toBe('stale_restored_route');
    expect(linkingMocks.addEventListener).not.toHaveBeenCalled();
  });

  it('waits briefly for a late OAuth URL only when an OAuth flow is expected', async () => {
    const { isOAuthLaunchExpected } = await import('@/features/auth/oauthLaunchExpectation');
    vi.mocked(isOAuthLaunchExpected).mockResolvedValue(true);
    linkingMocks.getInitialURL.mockResolvedValue(null);
    const promise = probeOAuthColdStartLaunchKind();
    await vi.advanceTimersByTimeAsync(STALE_OAUTH_CALLBACK_REDIRECT_MS + 50);
    await expect(promise).resolves.toBe('stale_restored_route');
  });
});

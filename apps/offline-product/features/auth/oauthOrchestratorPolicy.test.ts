import { describe, expect, it } from 'vitest';

import {
  resolveOAuthColdStartPhase,
  shouldAllowGoogleNativeBrowserFallback,
} from './oauthOrchestratorPolicy';

describe('oauthOrchestratorPolicy', () => {
  it('allows iOS EAS browser fallback', () => {
    expect(
      shouldAllowGoogleNativeBrowserFallback({
        platform: 'ios',
        isDev: false,
        isSimulatorInDev: false,
      }),
    ).toBe(true);
  });

  it('disallows Android physical-device browser fallback', () => {
    expect(
      shouldAllowGoogleNativeBrowserFallback({
        platform: 'android',
        isDev: false,
        isSimulatorInDev: false,
      }),
    ).toBe(false);
    expect(
      shouldAllowGoogleNativeBrowserFallback({
        platform: 'android',
        isDev: true,
        isSimulatorInDev: false,
      }),
    ).toBe(false);
  });

  it('allows Android emulator browser fallback in dev', () => {
    expect(
      shouldAllowGoogleNativeBrowserFallback({
        platform: 'android',
        isDev: true,
        isSimulatorInDev: true,
      }),
    ).toBe(true);
  });

  it('routes cold-start phases after session hydration', () => {
    expect(
      resolveOAuthColdStartPhase({
        url: null,
        deliveredToWaiter: false,
        hasSession: false,
      }),
    ).toBe('exit_to_home');
    expect(
      resolveOAuthColdStartPhase({
        url: null,
        deliveredToWaiter: false,
        hasSession: true,
      }),
    ).toBe('already_signed_in');
    expect(
      resolveOAuthColdStartPhase({
        url: 'tracebudoffline://auth/callback?code=abc',
        deliveredToWaiter: false,
        hasSession: false,
      }),
    ).toBe('needs_session_exchange');
  });
});

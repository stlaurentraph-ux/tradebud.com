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

  it('routes cold-start phases', () => {
    expect(
      resolveOAuthColdStartPhase({
        url: null,
        deliveredToWaiter: false,
        hasSession: false,
      }),
    ).toBe('missing_url');
  });
});

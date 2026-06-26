import { describe, expect, it } from 'vitest';

import {
  shouldDeferAuthRefreshForCreateAccountWizard,
  shouldSkipDeepLinkAuthSurfaceClose,
} from './signInAuthRefreshPolicy';

describe('signInAuthRefreshPolicy', () => {
  it('defers auth refresh while create-account wizard is visible', () => {
    expect(shouldDeferAuthRefreshForCreateAccountWizard(true)).toBe(true);
    expect(shouldDeferAuthRefreshForCreateAccountWizard(false)).toBe(false);
  });

  it('skips deep-link surface close while create-account wizard is visible', () => {
    expect(shouldSkipDeepLinkAuthSurfaceClose(true)).toBe(true);
    expect(shouldSkipDeepLinkAuthSurfaceClose(false)).toBe(false);
  });
});

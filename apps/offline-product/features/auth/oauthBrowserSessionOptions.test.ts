import { beforeEach, describe, expect, it, vi } from 'vitest';

const platformState = vi.hoisted(() => ({ os: 'android' as string }));

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return platformState.os;
    },
  },
}));

import { getOAuthBrowserSessionOptions } from './oauthBrowserSessionOptions';

describe('getOAuthBrowserSessionOptions', () => {
  beforeEach(() => {
    platformState.os = 'android';
  });

  it('keeps Android OAuth in the app task', () => {
    expect(getOAuthBrowserSessionOptions()).toEqual({
      createTask: false,
      showInRecents: false,
    });
  });

  it('returns no Android overrides on iOS', () => {
    platformState.os = 'ios';
    expect(getOAuthBrowserSessionOptions()).toEqual({});
  });
});

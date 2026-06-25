import { describe, expect, it } from 'vitest';

import { oauthBrowserSessionOptionsForPlatform } from './oauthBrowserSessionOptionsPolicy';

describe('oauthBrowserSessionOptionsForPlatform', () => {
  it('disables separate Chrome tasks on Android', () => {
    expect(oauthBrowserSessionOptionsForPlatform('android')).toEqual({
      createTask: false,
      showInRecents: false,
    });
  });

  it('keeps recents on iOS', () => {
    expect(oauthBrowserSessionOptionsForPlatform('ios')).toEqual({ showInRecents: true });
  });
});

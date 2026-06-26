import { describe, expect, it } from 'vitest';

import { mapSetPasswordError } from './mapAuthError';

describe('mapSetPasswordError', () => {
  it('maps weak and length errors', () => {
    expect(mapSetPasswordError({ message: 'Password should be at least 8 characters' })).toBe(
      'settings_password_too_short',
    );
    expect(mapSetPasswordError({ code: 'weak_password', message: 'weak' })).toBe(
      'settings_password_weak',
    );
  });

  it('maps session and reauthentication errors', () => {
    expect(mapSetPasswordError({ message: 'Auth session missing!' })).toBe(
      'settings_password_sign_in_required',
    );
    expect(mapSetPasswordError({ message: 'Password update requires reauthentication' })).toBe(
      'settings_password_reauth_required',
    );
  });

  it('does not fall back to sign_in_failed for unknown password errors', () => {
    expect(mapSetPasswordError({ message: 'Something unexpected from auth' })).toBe(
      'settings_password_save_failed',
    );
  });
});

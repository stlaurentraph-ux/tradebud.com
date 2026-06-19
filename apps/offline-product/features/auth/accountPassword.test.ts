import { describe, expect, it } from 'vitest';

import {
  getLinkedOAuthProviders,
  shouldOfferChangePassword,
  shouldOfferSetPassword,
  userHasEmailPasswordIdentity,
  validateAccountPassword,
} from './accountPasswordPolicy';

describe('accountPassword', () => {
  it('detects email identity', () => {
    expect(
      userHasEmailPasswordIdentity({
        identities: [{ provider: 'google' }, { provider: 'email' }],
      } as never),
    ).toBe(true);
  });

  it('offers set password for oauth sign-in without email identity', () => {
    expect(
      shouldOfferSetPassword({
        signedIn: true,
        authMethod: 'oauth',
        user: { identities: [{ provider: 'apple' }] } as never,
      }),
    ).toBe(true);
  });

  it('does not offer set password when email identity exists', () => {
    expect(
      shouldOfferSetPassword({
        signedIn: true,
        authMethod: 'oauth',
        user: { identities: [{ provider: 'google' }, { provider: 'email' }] } as never,
      }),
    ).toBe(false);
  });

  it('does not offer set password when oauth user already saved a password session', () => {
    expect(
      shouldOfferSetPassword({
        signedIn: true,
        authMethod: 'password',
        user: { identities: [{ provider: 'google' }], email: 'farmer@example.com' } as never,
      }),
    ).toBe(false);
  });

  it('offers change password when password auth is active', () => {
    expect(
      shouldOfferChangePassword({
        signedIn: true,
        authMethod: 'password',
        user: { email: 'farmer@example.com', identities: [{ provider: 'google' }] } as never,
      }),
    ).toBe(true);
  });

  it('offers change password when password credential is stored', () => {
    expect(
      shouldOfferChangePassword({
        signedIn: true,
        authMethod: 'oauth',
        hasPasswordCredential: true,
        user: { identities: [{ provider: 'google' }] } as never,
      }),
    ).toBe(true);
    expect(
      shouldOfferSetPassword({
        signedIn: true,
        authMethod: 'oauth',
        hasPasswordCredential: true,
        user: { identities: [{ provider: 'google' }] } as never,
      }),
    ).toBe(false);
  });

  it('validates password length and confirmation', () => {
    expect(validateAccountPassword('short', 'short')).toBe('settings_password_too_short');
    expect(validateAccountPassword('longenough', 'different')).toBe('settings_password_mismatch');
    expect(validateAccountPassword('longenough', 'longenough')).toBeNull();
  });

  it('collects linked oauth providers', () => {
    expect(
      getLinkedOAuthProviders({
        identities: [{ provider: 'google' }, { provider: 'apple' }],
      } as never),
    ).toEqual(['google', 'apple']);
  });
});

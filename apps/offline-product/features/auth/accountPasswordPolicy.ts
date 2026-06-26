import type { User } from '@supabase/supabase-js';

export const MIN_ACCOUNT_PASSWORD_LENGTH = 8;

export type OAuthProviderLabel = 'google' | 'apple';

export function userHasEmailPasswordIdentity(user: User | null | undefined): boolean {
  if (!user) return false;
  return (user.identities ?? []).some((identity) => identity.provider === 'email');
}

export function getLinkedOAuthProviders(user: User | null | undefined): OAuthProviderLabel[] {
  if (!user) return [];
  const found = new Set<OAuthProviderLabel>();
  for (const identity of user.identities ?? []) {
    if (identity.provider === 'google') found.add('google');
    if (identity.provider === 'apple') found.add('apple');
  }
  return [...found];
}

export function shouldOfferSetPassword(params: {
  signedIn: boolean;
  authMethod: 'password' | 'oauth' | 'phone_otp' | null;
  user: User | null;
  hasPasswordCredential?: boolean;
}): boolean {
  if (!params.signedIn || !params.user) return false;
  if (params.hasPasswordCredential) return false;
  if (userHasEmailPasswordIdentity(params.user)) return false;
  if (params.authMethod === 'password') return false;
  if (params.authMethod === 'oauth') return true;
  return getLinkedOAuthProviders(params.user).length > 0;
}

export function shouldOfferChangePassword(params: {
  signedIn: boolean;
  user: User | null;
  authMethod?: 'password' | 'oauth' | 'phone_otp' | null;
  hasPasswordCredential?: boolean;
}): boolean {
  if (!params.signedIn || !params.user) return false;
  if (params.hasPasswordCredential) return true;
  if (userHasEmailPasswordIdentity(params.user)) return true;
  return params.authMethod === 'password';
}

export function validateAccountPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_ACCOUNT_PASSWORD_LENGTH) {
    return 'settings_password_too_short';
  }
  if (password !== confirm) {
    return 'settings_password_mismatch';
  }
  return null;
}

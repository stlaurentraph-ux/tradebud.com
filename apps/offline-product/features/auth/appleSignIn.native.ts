import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import type { Session } from '@supabase/supabase-js';

import { getSupabaseAuthClient } from '@/features/api/syncAuthSession';

function fullNameFromCredential(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null,
): string {
  if (!fullName) return '';
  const parts = [fullName.givenName, fullName.middleName, fullName.familyName].filter(
    (part): part is string => Boolean(part && part.trim()),
  );
  return parts.join(' ').trim();
}

export async function signInWithAppleNative(): Promise<Session> {
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error('sign_in_oauth_failed');
  }

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  const rawNonce = Crypto.randomUUID();
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: rawNonce,
    });
  } catch (e) {
    const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
    if (code === 'ERR_REQUEST_CANCELED') {
      throw new Error('sign_in_oauth_cancelled');
    }
    throw new Error('sign_in_oauth_failed');
  }

  if (!credential.identityToken) {
    throw new Error('sign_in_oauth_failed');
  }

  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.session) {
    throw new Error('No session returned from OAuth.');
  }

  const fullName = fullNameFromCredential(credential.fullName);
  if (fullName) {
    await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        given_name: credential.fullName?.givenName ?? undefined,
        family_name: credential.fullName?.familyName ?? undefined,
      },
    });
    const { data: refreshed } = await supabase.auth.getSession();
    if (refreshed.session) {
      return refreshed.session;
    }
  }

  return data.session;
}

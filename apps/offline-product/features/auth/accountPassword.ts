import {
  getAuthCredentials,
  getAuthenticatedSupabaseClientWithSession,
  saveAndApplyPasswordSession,
} from '@/features/api/syncAuthSession';
import { mapSetPasswordError } from '@/features/auth/mapAuthError';
import { loadSyncAuthCredentials } from '@/features/security/syncAuthStorage';

export {
  getLinkedOAuthProviders,
  MIN_ACCOUNT_PASSWORD_LENGTH,
  shouldOfferChangePassword,
  shouldOfferSetPassword,
  userHasEmailPasswordIdentity,
  validateAccountPassword,
  type OAuthProviderLabel,
} from '@/features/auth/accountPasswordPolicy';

export async function setAccountPasswordForCurrentUser(
  newPassword: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const client = await getAuthenticatedSupabaseClientWithSession();
    if (!client) {
      return { ok: false, message: 'settings_password_sign_in_required' };
    }

    const { data: userData, error: userError } = await client.auth.getUser();
    const user = userData.user;
    if (userError || !user) {
      return { ok: false, message: 'settings_password_sign_in_required' };
    }

    const email = user.email?.trim() || getAuthCredentials().email.trim();
    if (!email) {
      return { ok: false, message: 'settings_password_no_email' };
    }

    const { error: updateError } = await client.auth.updateUser({ password: newPassword });
    if (updateError) {
      return { ok: false, message: mapSetPasswordError(updateError) };
    }

    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
      email,
      password: newPassword,
    });
    if (signInError || !signInData.session) {
      return {
        ok: false,
        message: signInError
          ? mapSetPasswordError(signInError)
          : 'settings_password_sign_in_required',
      };
    }

    await saveAndApplyPasswordSession(email, newPassword, signInData.session);

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'sign_in_session_expired') {
      return { ok: false, message: 'sign_in_session_expired' };
    }
    return { ok: false, message: 'settings_password_sign_in_required' };
  }
}

export async function hasStoredPasswordCredential(): Promise<boolean> {
  const credentials = await loadSyncAuthCredentials();
  return credentials?.method === 'password' && Boolean(credentials.password);
}

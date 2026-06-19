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

    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) {
      return { ok: false, message: mapSetPasswordError(error) };
    }

    const session = (await client.auth.getSession()).data.session;
    await saveAndApplyPasswordSession(email, newPassword, {
      access_token: session?.access_token ?? '',
      expires_at: session?.expires_at ?? null,
    });

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

import {
  getAccessTokenFromSupabase,
  getAuthCredentials,
  getAuthenticatedSupabaseClient,
  getSyncAuthUser,
  saveAndApplyPasswordSession,
} from '@/features/api/syncAuthSession';
import { mapSetPasswordError } from '@/features/auth/mapAuthError';

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
  const accessToken = await getAccessTokenFromSupabase();
  if (!accessToken) {
    return { ok: false, message: 'settings_password_sign_in_required' };
  }

  const user = await getSyncAuthUser();
  if (!user) {
    return { ok: false, message: 'settings_password_sign_in_required' };
  }

  const email = user.email?.trim() || getAuthCredentials().email.trim();
  if (!email) {
    return { ok: false, message: 'settings_password_no_email' };
  }

  const client = await getAuthenticatedSupabaseClient();
  if (!client) {
    return { ok: false, message: 'settings_password_sign_in_required' };
  }

  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) {
    return { ok: false, message: mapSetPasswordError(error) };
  }

  await saveAndApplyPasswordSession(email, newPassword, {
    access_token: accessToken,
    expires_at: null,
  });

  return { ok: true };
}

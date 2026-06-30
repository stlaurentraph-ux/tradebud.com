import {
  getAccessTokenFromSupabase,
  getAuthCredentials,
  getSupabaseAuthClient,
  getSyncAuthMethod,
  getSyncAuthUser,
  getTracebudApiBaseUrl,
  saveAndApplyPasswordSession,
} from '@/features/api/syncAuthSession';
import { mapSetPasswordError } from '@/features/auth/mapAuthError';
import {
  hasLinkedPasswordForOAuthUser,
  loadSyncAuthCredentials,
  saveLinkedPasswordForOAuthUser,
} from '@/features/security/syncAuthStorage';

export {
  getLinkedOAuthProviders,
  MIN_ACCOUNT_PASSWORD_LENGTH,
  shouldOfferChangePassword,
  shouldOfferSetPassword,
  userHasEmailPasswordIdentity,
  validateAccountPassword,
  type OAuthProviderLabel,
} from '@/features/auth/accountPasswordPolicy';

function parseApiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const message = (body as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }
  if (Array.isArray(message) && message.length > 0) {
    return String(message[0]);
  }
  return fallback;
}

async function setAccountPasswordViaBackend(
  password: string,
  accessToken: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const apiBase = getTracebudApiBaseUrl();
  const res = await fetch(`${apiBase}/v1/me/account-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const rawMessage = parseApiErrorMessage(body, res.statusText || 'Request failed');
    return { ok: false, message: mapSetPasswordError({ message: rawMessage }) };
  }

  return { ok: true };
}

export async function setAccountPasswordForCurrentUser(
  newPassword: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const accessToken = await getAccessTokenFromSupabase();
    if (!accessToken) {
      return { ok: false, message: 'settings_password_sign_in_required' };
    }

    const email =
      getAuthCredentials().email.trim() || (await getSyncAuthUser())?.email?.trim() || '';
    if (!email) {
      return { ok: false, message: 'settings_password_no_email' };
    }

    const backendResult = await setAccountPasswordViaBackend(newPassword, accessToken);
    if (!backendResult.ok) {
      return backendResult;
    }

    const authMethod = getSyncAuthMethod();
    if (authMethod === 'oauth') {
      await saveLinkedPasswordForOAuthUser(email, newPassword);
      return { ok: true };
    }

    const supabase = getSupabaseAuthClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: newPassword,
    });
    if (signInError || !signInData.session) {
      return { ok: true };
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
  if (credentials?.method === 'password' && credentials.password) {
    return true;
  }
  return hasLinkedPasswordForOAuthUser();
}

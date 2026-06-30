import {
  clearPersistedSyncAuth,
  getSupabaseAuthClient,
  hasSyncAuthSession,
  hydrateSyncAuthFromSettings,
  saveAndApplyPasswordSession,
  testBackendLogin,
} from '@/features/api/syncAuthSession';
import { bootstrapFieldAppProducer } from '@/features/api/fieldAppBootstrap';
import type { Plot } from '@/features/state/AppStateContext';
import { completeOAuthFarmerSession } from '@/features/auth/completeOAuthFarmerSession';
import { mapPasswordSignInError, normalizeSignInErrorCode } from '@/features/auth/mapAuthError';
import { mapOAuthErrorToCode } from '@/features/auth/oauthSession';
import { signInWithOAuthProvider, type OAuthProvider } from '@/features/auth/oauthSignIn';

export type SignInSyncResult =
  | { ok: true; missingName?: boolean; apiUnreachable?: boolean }
  | { ok: false; message: string };

export { clearPersistedSyncAuth };

export function isSyncSignedIn(): boolean {
  return hasSyncAuthSession();
}

export async function signInAndSyncPlots(params: {
  email: string;
  password: string;
  farmerId?: string;
  localPlots?: Plot[];
}): Promise<SignInSyncResult> {
  const email = params.email.trim();
  if (!email || !params.password) {
    return { ok: false, message: 'enter_email_password' };
  }

  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: params.password,
  });
  if (error) {
    return { ok: false, message: mapPasswordSignInError(error) };
  }
  if (!data.session) {
    return { ok: false, message: 'sign_in_failed' };
  }

  await saveAndApplyPasswordSession(email, params.password, data.session);

  if (params.farmerId) {
    const bootstrap = await bootstrapFieldAppProducer({
      farmerId: params.farmerId,
    });
    if (!bootstrap.ok) {
      await clearPersistedSyncAuth();
      return { ok: false, message: bootstrap.message };
    }
  }
  const res = await testBackendLogin();
  if (!res.ok) {
    const unreachable =
      res.message.toLowerCase().includes('network') ||
      res.message.toLowerCase().includes('localhost') ||
      res.message.toLowerCase().includes('failed to fetch') ||
      res.message.toLowerCase().includes('tracebud api returned');
    if (unreachable) {
      return { ok: true, apiUnreachable: true };
    }
    await clearPersistedSyncAuth();
    const code = normalizeSignInErrorCode(res.message);
    return { ok: false, message: code === res.message ? res.message : code };
  }
  // Post-auth auto-backup is triggered solely by `offerBackupAfterAuth` in
  // SignInSheetContext (U5) — running it here too caused a duplicate backup on
  // password sign-in. The OAuth path below preserves its own trigger because
  // OAuth completion does not always route through the sign-in sheet callback.
  return { ok: true };
}

export async function signInWithOAuthAndSyncPlots(params: {
  provider: OAuthProvider;
  farmerId?: string;
  localPlots?: Plot[];
}): Promise<SignInSyncResult> {
  try {
    const session = await signInWithOAuthProvider(params.provider);
    return completeOAuthFarmerSession({
      session,
      farmerId: params.farmerId,
      localPlots: params.localPlots,
    });
  } catch (e) {
    await hydrateSyncAuthFromSettings();
    if (hasSyncAuthSession()) {
      return { ok: true };
    }
    return { ok: false, message: mapOAuthErrorToCode(e) };
  }
}

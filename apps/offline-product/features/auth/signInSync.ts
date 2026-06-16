import {
  clearPersistedSyncAuth,
  getSyncAuthUser,
  hasSyncAuthSession,
  saveAndApplySyncAuth,
  testBackendLogin,
} from '@/features/api/syncAuthSession';
import { bootstrapFieldAppProducer } from '@/features/api/fieldAppBootstrap';
import type { Plot } from '@/features/state/AppStateContext';
import { completeOAuthFarmerSession } from '@/features/auth/completeOAuthFarmerSession';
import { shouldBootstrapFieldAppProfile } from '@/features/auth/fieldAppEligibility';
import { mapOAuthErrorToCode } from '@/features/auth/oauthSession';
import { signInWithOAuthProvider, type OAuthProvider } from '@/features/auth/oauthSignIn';
import { runAutoBackup } from '@/features/sync/runAutoBackup';

export type SignInSyncResult =
  | { ok: true; missingName?: boolean }
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
  await saveAndApplySyncAuth(email, params.password);
  if (params.farmerId) {
    const user = await getSyncAuthUser();
    if (user && shouldBootstrapFieldAppProfile({ user } as never)) {
      const bootstrap = await bootstrapFieldAppProducer({
        farmerId: params.farmerId,
      });
      if (!bootstrap.ok) {
        await clearPersistedSyncAuth();
        return { ok: false, message: bootstrap.message };
      }
    }
  }
  const res = await testBackendLogin();
  if (!res.ok) {
    return { ok: false, message: res.message };
  }
  if (params.farmerId && params.localPlots) {
    await runAutoBackup({
      farmerId: params.farmerId,
      localPlots: params.localPlots,
    });
  }
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
    return { ok: false, message: mapOAuthErrorToCode(e) };
  }
}

import {
  getAuthCredentials,
  saveAndApplySyncAuth,
  testBackendLogin,
} from '@/features/api/postPlot';
import type { Plot } from '@/features/state/AppStateContext';
import { uploadUnsyncedPlotsForFarmer } from '@/features/sync/plotServerSync';

export type SignInSyncResult = { ok: true } | { ok: false; message: string };

export function isSyncSignedIn(): boolean {
  const { email, password } = getAuthCredentials();
  return Boolean(email?.trim() && password);
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
  const res = await testBackendLogin();
  if (!res.ok) {
    return { ok: false, message: res.message };
  }
  if (params.farmerId && params.localPlots && params.localPlots.length > 0) {
    await uploadUnsyncedPlotsForFarmer({
      farmerId: params.farmerId,
      localPlots: params.localPlots,
    });
  }
  return { ok: true };
}

import { clearFieldProducerBootstrapCache } from '@/features/api/fieldAppBootstrap';
import type { Plot } from '@/features/state/AppStateContext';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import {
  deleteSetting,
  getSetting,
  resetLocalFieldProducerState,
  setSetting,
} from '@/features/state/persistence';
import {
  countServerPlotsForPostAuthRestore,
  countServerVouchersForPostAuthRestore,
} from '@/features/sync/postAuthSyncOffer';
import { invalidateServerPlotFetchCache } from '@/features/sync/serverPlotFetchCache';
import { invalidateServerPlotListCache } from '@/features/sync/serverPlotListCache';

export const LAST_AUTHENTICATED_EMAIL_KEY = 'tracebud.lastAuthenticatedEmail';

/** Set on sign-out and after successful auth — never used to wipe data on sign-out. */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function rememberLastAuthenticatedEmail(email: string): Promise<void> {
  const normalized = normalizeAuthEmail(email);
  if (!normalized) return;
  await setSetting(LAST_AUTHENTICATED_EMAIL_KEY, normalized);
}

export async function getLastAuthenticatedEmail(): Promise<string | null> {
  const stored = (await getSetting(LAST_AUTHENTICATED_EMAIL_KEY))?.trim();
  return stored ? normalizeAuthEmail(stored) : null;
}

export async function clearLastAuthenticatedEmail(): Promise<void> {
  await deleteSetting(LAST_AUTHENTICATED_EMAIL_KEY).catch(() => undefined);
}

export type AccountSwitchReason = 'same_account' | 'guest_first_auth' | 'switched_account';

export type AccountSwitchResolution = {
  /** True when a previous account's local producer data was cleared for a different auth email. */
  clearedStaleLocalData: boolean;
  reason: AccountSwitchReason;
};

/**
 * Sign-out keeps local SQLite data intact. This runs only when a new session starts
 * (sign-in / sign-up) to decide whether stale on-device producer data belongs to another account.
 */
export async function resolveAccountSwitchLocalState(
  authEmail: string,
): Promise<AccountSwitchResolution> {
  const normalized = normalizeAuthEmail(authEmail);
  if (!normalized) {
    return { clearedStaleLocalData: false, reason: 'same_account' };
  }

  const last = await getLastAuthenticatedEmail();
  if (!last) {
    await rememberLastAuthenticatedEmail(normalized);
    return { clearedStaleLocalData: false, reason: 'guest_first_auth' };
  }
  if (last === normalized) {
    return { clearedStaleLocalData: false, reason: 'same_account' };
  }

  await resetLocalFieldProducerState();
  clearFieldProducerBootstrapCache();
  invalidateServerPlotFetchCache();
  invalidateServerPlotListCache();
  trackEvent(ANALYTICS_EVENTS.ACCOUNT_SWITCH_LOCAL_RESET, { previousEmail: last });
  await rememberLastAuthenticatedEmail(normalized);
  return { clearedStaleLocalData: true, reason: 'switched_account' };
}

/** Whether the signed-in account already has plots or harvests stored in Tracebud cloud. */
export async function accountHasCloudFieldData(
  profileFarmerId: string,
  localPlots: Plot[] = [],
): Promise<boolean> {
  const scopedId = profileFarmerId.trim();
  if (!scopedId) return false;

  const [plotCount, voucherCount] = await Promise.all([
    countServerPlotsForPostAuthRestore({ profileFarmerId: scopedId, localPlots }),
    countServerVouchersForPostAuthRestore({ profileFarmerId: scopedId, localPlots }),
  ]);
  return (plotCount ?? 0) > 0 || (voucherCount ?? 0) > 0;
}

/** @deprecated Prefer {@link resolveAccountSwitchLocalState}. */
export async function ensureLocalStateForAuthAccount(authEmail: string): Promise<boolean> {
  const resolution = await resolveAccountSwitchLocalState(authEmail);
  return resolution.clearedStaleLocalData;
}

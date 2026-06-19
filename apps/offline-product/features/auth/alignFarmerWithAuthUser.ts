import {
  fetchOwnedFarmerIdsFromApi,
  getBootstrapOwnedFarmerIds,
} from '@/features/api/fieldAppBootstrap';
import { getAuthenticatedSupabaseUserId } from '@/features/api/syncAuthSession';
import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { isUuid } from '@/features/auth/farmerProfileBootstrap';
import { logAuditEvent, rekeyFarmerIdInDatabase, adoptOnDeviceFarmerScope } from '@/features/state/persistence';
import { fetchPlotsForFarmerCached } from '@/features/sync/serverPlotFetchCache';

async function shouldAlignFarmerIdToAuth(
  currentFarmerId: string,
  authUserId: string,
  _localPlots: Plot[],
): Promise<boolean> {
  if (currentFarmerId === authUserId) return false;
  if (!isUuid(currentFarmerId) || !isUuid(authUserId)) return false;

  // Server is the source of truth for which farmer profiles this auth user owns.
  // If it owns a producer profile that is NOT the auth uid, that profile is the
  // canonical home for plots/harvests — never collapse the device onto the
  // (usually empty) auth-uid profile, even when a plot fetch transiently returns
  // nothing. This is what previously caused the device id to flip-flop between
  // the auth uid and the linked producer profile across sync runs.
  const serverOwnedIds = new Set(
    [...(await fetchOwnedFarmerIdsFromApi()), ...getBootstrapOwnedFarmerIds()]
      .map((id) => id.trim())
      .filter(Boolean),
  );
  if ([...serverOwnedIds].some((id) => id !== authUserId)) {
    return false;
  }

  const candidateIds = [...new Set([...serverOwnedIds, currentFarmerId, authUserId])];
  try {
    for (const farmerId of candidateIds) {
      const rows = await fetchPlotsForFarmerCached(farmerId);
      if ((rows?.length ?? 0) > 0) {
        return false;
      }
    }
  } catch {
    return false;
  }

  // No server profile other than the auth uid and no plots anywhere: it is safe
  // to align the local device id with the Supabase auth uid.
  return true;
}

/**
 * When safe, align local `farmer.id` with Supabase `auth.uid()` so producer identity,
 * storage paths, and API scope stay consistent. Skips rekey when server plots already
 * exist under the current local farmer UUID.
 */
export async function alignFarmerWithAuthUser(
  farmer: FarmerProfile | undefined,
  options?: { localPlots?: Plot[] },
): Promise<{ farmer: FarmerProfile | undefined; rekeyed: boolean }> {
  if (!farmer) {
    return { farmer, rekeyed: false };
  }

  const authUserId = await getAuthenticatedSupabaseUserId();
  if (!authUserId || !isUuid(authUserId)) {
    return { farmer, rekeyed: false };
  }

  if (farmer.id === authUserId) {
    return { farmer, rekeyed: false };
  }

  const localPlots = options?.localPlots ?? [];
  const canAlign = await shouldAlignFarmerIdToAuth(farmer.id, authUserId, localPlots);
  if (!canAlign) {
    return { farmer, rekeyed: false };
  }

  const previousId = farmer.id;
  await rekeyFarmerIdInDatabase(previousId, authUserId);
  await adoptOnDeviceFarmerScope(authUserId).catch(() => undefined);
  const aligned: FarmerProfile = { ...farmer, id: authUserId };

  await logAuditEvent({
    userId: authUserId,
    eventType: 'farmer_id_aligned_with_auth',
    payload: { previousId, authUserId },
  }).catch(() => undefined);

  return { farmer: aligned, rekeyed: true };
}

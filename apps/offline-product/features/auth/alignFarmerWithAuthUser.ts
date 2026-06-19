import { fetchPlotsForFarmer } from '@/features/api/postPlot';
import {
  fetchOwnedFarmerIdsFromApi,
  getBootstrapOwnedFarmerIds,
} from '@/features/api/fieldAppBootstrap';
import { getAuthenticatedSupabaseUserId } from '@/features/api/syncAuthSession';
import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { isUuid } from '@/features/auth/farmerProfileBootstrap';
import { logAuditEvent, rekeyFarmerIdInDatabase, adoptOnDeviceFarmerScope } from '@/features/state/persistence';

async function shouldAlignFarmerIdToAuth(
  currentFarmerId: string,
  authUserId: string,
  localPlots: Plot[],
): Promise<boolean> {
  if (currentFarmerId === authUserId) return false;
  if (!isUuid(currentFarmerId) || !isUuid(authUserId)) return false;

  const ownedFarmerIds = [
    ...new Set([
      ...(await fetchOwnedFarmerIdsFromApi()),
      ...getBootstrapOwnedFarmerIds(),
      currentFarmerId,
      authUserId,
    ]),
  ];

  try {
    for (const farmerId of ownedFarmerIds) {
      const rows = await fetchPlotsForFarmer(farmerId);
      if ((rows?.length ?? 0) > 0) {
        return false;
      }
    }
  } catch {
    return false;
  }

  if (localPlots.length === 0) {
    return true;
  }

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

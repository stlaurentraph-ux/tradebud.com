import { fetchPlotsForFarmer } from '@/features/api/postPlot';
import { bootstrapFieldAppProducer, getBootstrapOwnedFarmerIds } from '@/features/api/fieldAppBootstrap';
import type { Plot } from '@/features/state/AppStateContext';

function uniqueFarmerIdCandidates(candidates: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const raw of candidates) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }
  return ordered;
}

/**
 * Picks the farmer id that can list server plots for sync (auth uid vs device profile id).
 */
export async function resolveFieldApiFarmerId(params: {
  profileFarmerId: string;
  localPlots: Plot[];
}): Promise<string> {
  const profileFarmerId = params.profileFarmerId.trim();
  if (!profileFarmerId) {
    return profileFarmerId;
  }

  await bootstrapFieldAppProducer({ farmerId: profileFarmerId }).catch(() => undefined);

  const candidates = uniqueFarmerIdCandidates([
    ...getBootstrapOwnedFarmerIds(),
    profileFarmerId,
    ...params.localPlots.map((plot) => plot.farmerId ?? ''),
  ]);

  let bestId = profileFarmerId;
  let bestPlotCount = -1;
  for (const farmerId of candidates) {
    try {
      const rows = await fetchPlotsForFarmer(farmerId);
      const count = rows?.length ?? 0;
      if (count > bestPlotCount) {
        bestPlotCount = count;
        bestId = farmerId;
      }
    } catch {
      // try next candidate
    }
  }

  return bestId;
}

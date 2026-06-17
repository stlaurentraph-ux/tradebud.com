import { effectivePlotAreaHectares } from '@/features/harvest/plotYieldCapacity';
import { findBackendPlotForLocal } from '@/features/plots/backendPlotMatch';
import type { HarvestPlotOption } from '@/features/harvest/multiPlotDeliverySession';

type PlotForHarvestPicker = {
  id: string;
  areaHectares: number;
  declaredAreaHectares?: number;
  kind: 'point' | 'polygon';
  name?: string;
};

/** Id used in harvest plot pickers — server row when linked, else local plot id. */
export function resolveHarvestPlotPickerId(
  plot: PlotForHarvestPicker,
  backendPlots: unknown[],
): string {
  const match = findBackendPlotForLocal(plot, backendPlots) as { id?: unknown } | null;
  if (match?.id != null) return String(match.id);
  return plot.id;
}

export function findHarvestPlotOption(params: {
  plotId: string;
  mergedPlots: readonly HarvestPlotOption[];
  localPlots: readonly PlotForHarvestPicker[];
  backendPlots: unknown[];
}): HarvestPlotOption | undefined {
  const direct = params.mergedPlots.find((p) => String(p.id) === String(params.plotId));
  if (direct) return direct;

  const local = params.localPlots.find((p) => String(p.id) === String(params.plotId));
  if (!local) return undefined;

  const pickerId = resolveHarvestPlotPickerId(local, params.backendPlots);
  return params.mergedPlots.find((p) => String(p.id) === String(pickerId));
}

type LocalPlotForMerge = {
  id: string;
  farmerId: string;
  name: string;
  areaHectares: number;
  declaredAreaHectares?: number;
  kind: 'point' | 'polygon';
};

/**
 * Plots keyed to the active farmer, with a fallback to all on-device plots when ids
 * diverged before auth alignment (My Plots lists every local row).
 */
export function resolveLocalPlotsForFarmer(
  localPlots: readonly LocalPlotForMerge[],
  farmerId?: string | null,
): LocalPlotForMerge[] {
  if (!farmerId) return [...localPlots];
  const owned = localPlots.filter((plot) => plot.farmerId === farmerId);
  return owned.length > 0 ? owned : [...localPlots];
}

/** Server-backed plots plus unsynced local plots for harvest / delivery pickers. */
export function buildMergedHarvestPlots(params: {
  backendPlots: unknown[];
  localPlots: readonly LocalPlotForMerge[];
  farmerId?: string | null;
}): HarvestPlotOption[] {
  const scopedLocal = resolveLocalPlotsForFarmer(params.localPlots, params.farmerId);
  const byId = new Map<string, HarvestPlotOption>();
  const localIdsLinkedToServer = new Set<string>();

  for (const row of params.backendPlots) {
    const id = String((row as { id?: unknown })?.id ?? '');
    if (!id) continue;

    const localMatch =
      params.localPlots.find((lp) => {
        const match = findBackendPlotForLocal(lp, params.backendPlots) as { id?: unknown } | null;
        return match != null && String(match.id ?? '') === id;
      }) ?? null;

    if (localMatch) {
      localIdsLinkedToServer.add(localMatch.id);
    }

    const plotKind = (localMatch?.kind ??
      (row as { kind?: unknown }).kind) as 'point' | 'polygon' | undefined;

    const areaHa = effectivePlotAreaHectares({
      kind: plotKind,
      declaredAreaHectares:
        (row as { declared_area_ha?: unknown }).declared_area_ha ??
        localMatch?.declaredAreaHectares,
      areaHectares:
        (row as { area_ha?: unknown }).area_ha ??
        (row as { areaHa?: unknown }).areaHa ??
        localMatch?.areaHectares,
    });

    byId.set(id, {
      id,
      name: String(localMatch?.name ?? (row as { display_name?: unknown }).display_name ?? 'Plot'),
      area_ha: areaHa,
      localOnly: false,
    });
  }

  for (const lp of scopedLocal) {
    if (localIdsLinkedToServer.has(lp.id)) continue;

    const id = String(lp.id);
    if (byId.has(id)) continue;

    byId.set(id, {
      id,
      name: lp.name,
      area_ha: effectivePlotAreaHectares({
        kind: lp.kind,
        declaredAreaHectares: lp.declaredAreaHectares,
        areaHectares: lp.areaHectares,
      }),
      localOnly: true,
    });
  }

  return Array.from(byId.values());
}

import { effectivePlotAreaHectares } from '@/features/harvest/plotYieldCapacity';
import { backendRowMatchesLocalClientId } from '@/features/plots/backendPlotMatch';
import {
  resolveServerPlotIdForLocal,
  type PlotServerLinks,
} from '@/features/plots/plotServerLink';
import type { HarvestPlotOption } from '@/features/harvest/multiPlotDeliverySession';

function optionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

type PlotForHarvestPicker = {
  id: string;
  areaHectares: number;
  declaredAreaHectares?: number;
  kind: 'point' | 'polygon';
  name?: string;
};

type LocalPlotForMerge = {
  id: string;
  farmerId: string;
  name: string;
  areaHectares: number;
  declaredAreaHectares?: number;
  kind: 'point' | 'polygon';
};

/** Id used in harvest plot pickers — server row when linked, else local plot id. */
export function resolveHarvestPlotPickerId(
  plot: PlotForHarvestPicker,
  backendPlots: unknown[],
  plotServerLinks?: PlotServerLinks | null,
): string {
  const resolved = resolveServerPlotIdForLocal(plot, backendPlots, plotServerLinks);
  if (resolved) return resolved;
  return plot.id;
}

export function findHarvestPlotOption(params: {
  plotId: string;
  mergedPlots: readonly HarvestPlotOption[];
  localPlots: readonly PlotForHarvestPicker[];
  backendPlots: unknown[];
  plotServerLinks?: PlotServerLinks | null;
}): HarvestPlotOption | undefined {
  const direct = params.mergedPlots.find((p) => String(p.id) === String(params.plotId));
  if (direct) return direct;

  const local = params.localPlots.find((p) => String(p.id) === String(params.plotId));
  if (!local) return undefined;

  const pickerId = resolveHarvestPlotPickerId(
    local,
    params.backendPlots,
    params.plotServerLinks,
  );
  return params.mergedPlots.find((p) => String(p.id) === String(pickerId));
}

/** Map harvest picker id (often server uuid) back to the on-device plot row. */
export function resolveLocalPlotForHarvestSubmit<T extends LocalPlotForMerge>(params: {
  selectedPlotId: string;
  localPlots: readonly T[];
  backendPlots: unknown[];
  plotServerLinks?: PlotServerLinks | null;
}): T | null {
  const selectedId = String(params.selectedPlotId);

  const direct = params.localPlots.find((plot) => String(plot.id) === selectedId);
  if (direct) return direct;

  const linkedLocalId = Object.entries(params.plotServerLinks ?? {}).find(
    ([, serverId]) => String(serverId) === selectedId,
  )?.[0];
  if (linkedLocalId) {
    const linked = params.localPlots.find((plot) => plot.id === linkedLocalId);
    if (linked) return linked;
  }

  for (const localPlot of params.localPlots) {
    const resolved = resolveServerPlotIdForLocal(
      localPlot,
      params.backendPlots,
      params.plotServerLinks,
    );
    if (resolved && String(resolved) === selectedId) {
      return localPlot;
    }
  }

  const serverRow = (params.backendPlots as {
    id?: unknown;
    name?: string;
    client_plot_id?: string | null;
    clientPlotId?: string | null;
  }[]).find((row) => String(row.id ?? '') === selectedId);
  if (!serverRow) return null;

  const byClientId = params.localPlots.find((plot) =>
    backendRowMatchesLocalClientId(serverRow, plot.id),
  );
  if (byClientId) return byClientId;

  const displayName = String(serverRow.name ?? '').trim();
  if (displayName) {
    return params.localPlots.find((plot) => plot.name === displayName) ?? null;
  }

  return null;
}

/** Plot detail routes use on-device plot ids — map server voucher ids when needed. */
export function resolveLocalPlotIdForRoute(params: {
  routePlotId: string;
  localPlots: readonly LocalPlotForMerge[];
  backendPlots: unknown[];
  plotServerLinks?: PlotServerLinks | null;
}): string {
  const routeId = String(params.routePlotId).trim();
  if (!routeId) return routeId;
  if (params.localPlots.some((plot) => plot.id === routeId)) return routeId;

  const resolved = resolveLocalPlotForHarvestSubmit({
    selectedPlotId: routeId,
    localPlots: params.localPlots,
    backendPlots: params.backendPlots,
    plotServerLinks: params.plotServerLinks,
  });
  return resolved?.id ?? routeId;
}

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
  plotServerLinks?: PlotServerLinks | null;
}): HarvestPlotOption[] {
  const backendPlots = Array.isArray(params.backendPlots) ? params.backendPlots : [];
  const scopedLocal = resolveLocalPlotsForFarmer(params.localPlots, params.farmerId);
  const links = params.plotServerLinks ?? null;
  const byId = new Map<string, HarvestPlotOption>();
  const localIdsLinkedToServer = new Set<string>();

  for (const row of backendPlots) {
    const id = String((row as { id?: unknown })?.id ?? '');
    if (!id) continue;

    const localMatch =
      params.localPlots.find((lp) => {
        const resolved = resolveServerPlotIdForLocal(lp, backendPlots, links);
        return resolved === id;
      }) ?? null;

    if (localMatch) {
      localIdsLinkedToServer.add(localMatch.id);
    }

    const plotKind = (localMatch?.kind ??
      (row as { kind?: unknown }).kind) as 'point' | 'polygon' | undefined;

    const areaHa = effectivePlotAreaHectares({
      kind: plotKind,
      declaredAreaHectares:
        optionalNumber((row as { declared_area_ha?: unknown }).declared_area_ha) ??
        localMatch?.declaredAreaHectares,
      areaHectares:
        optionalNumber((row as { area_ha?: unknown }).area_ha) ??
        optionalNumber((row as { areaHa?: unknown }).areaHa) ??
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

    const persisted = links?.[lp.id]?.trim();
    if (persisted) {
      const linkStillValid =
        backendPlots.length === 0 ||
        (backendPlots as { id?: unknown }[]).some(
          (row) => String(row?.id ?? '') === persisted,
        );
      if (linkStillValid) {
        localIdsLinkedToServer.add(lp.id);
        if (!byId.has(persisted)) {
          byId.set(persisted, {
            id: persisted,
            name: lp.name,
            area_ha: effectivePlotAreaHectares({
              kind: lp.kind,
              declaredAreaHectares: lp.declaredAreaHectares,
              areaHectares: lp.areaHectares,
            }),
            localOnly: false,
          });
        }
        continue;
      }
    }

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

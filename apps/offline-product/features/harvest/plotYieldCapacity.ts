/** Biological yield cap used for plot-level harvest validation (kg per hectare). */
export const YIELD_CAP_KG_PER_HA = 1500;

export type PlotAreaKind = 'point' | 'polygon';

export type PlotAreaSource = 'gps' | 'declared' | 'none';

/**
 * Mapped polygon → GPS/walk perimeter area.
 * Point plot (or no GPS area) → farmer-declared hectares when set.
 */
export function resolvePlotAreaHa(params: {
  areaHectares?: number | null;
  declaredAreaHectares?: number | null;
  kind?: PlotAreaKind | null;
}): { hectares: number; source: PlotAreaSource } {
  const gps = params.areaHectares;
  const hasGps = gps != null && Number.isFinite(gps) && gps > 0;
  const declared = params.declaredAreaHectares;
  const hasDeclared = declared != null && Number.isFinite(declared) && declared > 0;

  if (params.kind === 'polygon' && hasGps) {
    return { hectares: gps, source: 'gps' };
  }
  if (params.kind === 'point' && hasDeclared) {
    return { hectares: declared, source: 'declared' };
  }
  if (hasGps) {
    return { hectares: gps, source: 'gps' };
  }
  if (hasDeclared) {
    return { hectares: declared, source: 'declared' };
  }
  return { hectares: 0, source: 'none' };
}

export function effectivePlotAreaHectares(params: {
  areaHectares?: number | null;
  declaredAreaHectares?: number | null;
  kind?: PlotAreaKind | null;
}): number {
  return resolvePlotAreaHa(params).hectares;
}

export function computePlotYieldCapKg(areaHa: number): number {
  if (!Number.isFinite(areaHa) || areaHa <= 0) return 0;
  return Math.round(areaHa * YIELD_CAP_KG_PER_HA);
}

export function computePlotYieldAvailability(params: {
  areaHa: number;
  deliveredKg: number;
  reservedKg?: number;
}): { capKg: number; usedKg: number; availableKg: number } {
  const capKg = computePlotYieldCapKg(params.areaHa);
  const usedKg = Math.round(params.deliveredKg + (params.reservedKg ?? 0));
  return {
    capKg,
    usedKg,
    availableKg: Math.max(0, capKg - usedKg),
  };
}

export function sumDeliveredKgByPlot(
  vouchers: readonly unknown[],
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const row of vouchers) {
    const v = row as { plot_id?: unknown; plotId?: unknown; kg?: unknown; kg_delivered?: unknown; weight_kg?: unknown };
    const pid = String(v.plot_id ?? v.plotId ?? '');
    if (!pid) continue;
    const kg = Number(v.kg ?? v.kg_delivered ?? v.weight_kg ?? 0);
    if (!Number.isFinite(kg)) continue;
    acc[pid] = (acc[pid] ?? 0) + kg;
  }
  return acc;
}

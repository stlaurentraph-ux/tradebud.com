/**
 * Resolve a backend plot row for a local plot: prefer exact name match, else
 * closest area_ha among rows with the same geometry kind (point vs polygon).
 */

export type LocalPlotForBackendMatch = {
  name?: string;
  areaHectares: number;
  kind: 'point' | 'polygon';
};

export function findBackendPlotForLocal(
  localPlot: LocalPlotForBackendMatch,
  backendRows: unknown[],
): unknown | null {
  const byName = (backendRows as { name?: string }[]).find(
    (p) => String(p?.name ?? '') === String(localPlot.name ?? ''),
  );
  if (byName) return byName;

  const targetArea = Number(localPlot.areaHectares);
  const byAreaKind = (backendRows as { area_ha?: unknown; kind?: unknown }[])
    .map((p) => ({
      p,
      area: Number(p?.area_ha ?? NaN),
      kind: String(p?.kind ?? ''),
    }))
    .filter((x) => Number.isFinite(x.area) && x.kind === localPlot.kind)
    .sort((a, b) => Math.abs(a.area - targetArea) - Math.abs(b.area - targetArea))[0]?.p;

  return byAreaKind ?? null;
}

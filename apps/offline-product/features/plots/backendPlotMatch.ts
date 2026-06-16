/**
 * Resolve a backend plot row for a local plot.
 * Prefer stable client id (`plot.id` stored in server `name`), then legacy display name.
 */

export type LocalPlotForBackendMatch = {
  id: string;
  name?: string;
  areaHectares: number;
  kind: 'point' | 'polygon';
};

export function findBackendPlotForLocal(
  localPlot: LocalPlotForBackendMatch,
  backendRows: unknown[],
): unknown | null {
  const rows = backendRows as { id?: unknown; name?: string; area_ha?: unknown; kind?: unknown }[];

  const byClientId = rows.find((p) => String(p?.name ?? '') === String(localPlot.id));
  if (byClientId) return byClientId;

  const displayName = String(localPlot.name ?? '');
  if (displayName) {
    const byName = rows.find((p) => String(p?.name ?? '') === displayName);
    if (byName) return byName;
  }

  const targetArea = Number(localPlot.areaHectares);
  const byAreaKind = rows
    .map((p) => ({
      p,
      area: Number(p?.area_ha ?? NaN),
      kind: String(p?.kind ?? ''),
    }))
    .filter((x) => Number.isFinite(x.area) && x.kind === localPlot.kind)
    .sort((a, b) => Math.abs(a.area - targetArea) - Math.abs(b.area - targetArea))[0]?.p;

  return byAreaKind ?? null;
}

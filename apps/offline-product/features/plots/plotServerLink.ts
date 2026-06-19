import { findBackendPlotForLocal, type LocalPlotForBackendMatch } from '@/features/plots/backendPlotMatch';

export type PlotServerLinks = Record<string, string>;

export function resolveServerPlotIdForLocal(
  localPlot: LocalPlotForBackendMatch,
  backendRows: unknown[],
  links?: PlotServerLinks | null,
): string | null {
  const persisted = links?.[localPlot.id]?.trim();
  if (persisted) {
    if (backendRows.length === 0) return persisted;
    const row = (backendRows as { id?: unknown }[]).find(
      (entry) => String(entry?.id ?? '') === persisted,
    );
    if (row) return persisted;
  }

  const hit = findBackendPlotForLocal(localPlot, backendRows);
  return hit != null && (hit as { id?: unknown }).id != null
    ? String((hit as { id: unknown }).id)
    : null;
}

/** Fill missing local→server links from the current API plot list. */
export function reconcilePlotServerLinks(
  localPlots: readonly LocalPlotForBackendMatch[],
  backendPlots: unknown[],
  existing: PlotServerLinks,
): PlotServerLinks {
  const next: PlotServerLinks = { ...existing };

  for (const localPlot of localPlots) {
    const persisted = next[localPlot.id]?.trim();
    if (persisted) {
      const stillOnServer = (backendPlots as { id?: unknown }[]).some(
        (row) => String(row?.id ?? '') === persisted,
      );
      if (stillOnServer) continue;
      delete next[localPlot.id];
    }

    const resolved = resolveServerPlotIdForLocal(localPlot, backendPlots, next);
    if (resolved) {
      next[localPlot.id] = resolved;
    }
  }

  return next;
}

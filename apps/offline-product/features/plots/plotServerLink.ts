import {
  backendRowMatchesLocalClientId,
  canTrustPersistedPlotServerLink,
  findBackendPlotForLocal,
  findOrphanServerPlotForLocalUpload,
  findServerPlotForSyncConfirmation,
  isServerOnlyDemoPlot,
  type LocalPlotForBackendMatch,
} from '@/features/plots/backendPlotMatch';

export type PlotServerLinks = Record<string, string>;

/** True when this server row was created from the given local plot id. */
export function serverPlotRowOwnedByLocalDevice(
  row: { name?: string; client_plot_id?: string | null },
  localPlotId: string,
): boolean {
  return backendRowMatchesLocalClientId(row, localPlotId);
}

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

/**
 * Strict match for sync/upload pending counts: verified server link or stable
 * client id — never generic display names like "Plot 1" / "Plot 3".
 */
export function resolveConfirmedServerPlotIdForLocal(
  localPlot: LocalPlotForBackendMatch,
  backendRows: unknown[],
  links?: PlotServerLinks | null,
  options?: { localPlotIds?: ReadonlySet<string> },
): string | null {
  const localPlotIds = options?.localPlotIds ?? new Set([localPlot.id]);
  const persisted = links?.[localPlot.id]?.trim();
  if (persisted && backendRows.length > 0) {
    const row = (backendRows as {
      id?: unknown;
      name?: string;
      client_plot_id?: string | null;
      kind?: unknown;
      area_ha?: unknown;
    }[]).find((entry) => String(entry?.id ?? '') === persisted);
    if (
      row &&
      canTrustPersistedPlotServerLink(row, localPlot.id, persisted, localPlotIds)
    ) {
      return persisted;
    }
  }
  if (backendRows.length === 0) return null;

  const rows = backendRows as { id?: unknown; name?: string; client_plot_id?: string | null }[];
  const byClientId = rows.find((p) => backendRowMatchesLocalClientId(p, localPlot.id));
  if (byClientId?.id != null) return String(byClientId.id);

  const confirmed = findServerPlotForSyncConfirmation(localPlot, backendRows, localPlotIds);
  return confirmed?.id != null ? String(confirmed.id) : null;
}

/** Fill missing local→server links from the current API plot list. */
export function reconcilePlotServerLinks(
  localPlots: readonly LocalPlotForBackendMatch[],
  backendPlots: unknown[],
  existing: PlotServerLinks,
): PlotServerLinks {
  const next: PlotServerLinks = { ...existing };
  const localPlotIds = new Set(localPlots.map((plot) => plot.id));

  for (const localPlot of localPlots) {
    const persisted = next[localPlot.id]?.trim();
    if (persisted) {
      const row = (backendPlots as {
        id?: unknown;
        name?: string;
        client_plot_id?: string | null;
        kind?: unknown;
        area_ha?: unknown;
      }[]).find((entry) => String(entry?.id ?? '') === persisted);
      const stillOnServer = row != null;
      const stillValid =
        stillOnServer &&
        canTrustPersistedPlotServerLink(row, localPlot.id, persisted, localPlotIds);
      if (stillValid) continue;
      delete next[localPlot.id];
    }

    const resolved = resolveConfirmedServerPlotIdForLocal(localPlot, backendPlots, next, {
      localPlotIds,
    });
    if (resolved) {
      next[localPlot.id] = resolved;
    }
  }

  return next;
}

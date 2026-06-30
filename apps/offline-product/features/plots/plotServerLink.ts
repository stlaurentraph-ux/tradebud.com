import {
  backendRowMatchesLocalClientId,
  canTrustPersistedPlotServerLink,
  findBackendPlotForLocal,
  findOrphanServerPlotForLocalUpload,
  findServerPlotForSyncConfirmation,
  isServerOnlyDemoPlot,
  type LocalPlotForBackendMatch,
} from '@/features/plots/backendPlotMatch';
import {
  resolveBackendPlotComplianceStatus,
  type BackendPlotComplianceStatus,
} from '@/features/compliance/plotDeforestationStatus';

export type PlotServerLinks = Record<string, string>;

export type BackendPlotMeta = {
  id: string | null;
  status: BackendPlotComplianceStatus;
  deforestationScreening: unknown;
  sinaph: boolean;
  indigenous: boolean;
};

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

/** Compliance cards need a server row in the current fetch — not just a stale local link. */
export function resolveBackendPlotMetaForLocal(
  localPlot: LocalPlotForBackendMatch,
  backendRows: unknown[],
  links?: PlotServerLinks | null,
): BackendPlotMeta {
  const empty: BackendPlotMeta = {
    id: null,
    status: 'pending_check',
    deforestationScreening: null,
    sinaph: false,
    indigenous: false,
  };
  if (backendRows.length === 0) return empty;

  let serverId: string | null = null;
  const persisted = links?.[localPlot.id]?.trim();
  if (persisted) {
    const row = (backendRows as { id?: unknown }[]).find(
      (entry) => String(entry?.id ?? '') === persisted,
    );
    if (row) serverId = persisted;
  }
  if (!serverId) {
    const hit = findBackendPlotForLocal(localPlot, backendRows);
    serverId =
      hit != null && (hit as { id?: unknown }).id != null
        ? String((hit as { id: unknown }).id)
        : null;
  }
  if (!serverId) return empty;

  const match = (backendRows as {
    id?: unknown;
    status?: unknown;
    deforestation_screening?: unknown;
    sinaph_overlap?: boolean;
    indigenous_overlap?: boolean;
  }[]).find((row) => String(row?.id ?? '') === serverId);
  if (!match) return empty;

  return {
    id: serverId,
    status: resolveBackendPlotComplianceStatus(match),
    deforestationScreening: match.deforestation_screening ?? null,
    sinaph: match.sinaph_overlap === true,
    indigenous: match.indigenous_overlap === true,
  };
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
  // Global claim map: a server plot id can be linked to at most one local plot.
  // Without this, two local plots can both match the same orphan server row
  // (e.g. same name/area) and overwrite each other's link on every sync (C6).
  const claimedServerIds = new Set<string>();

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
      if (stillValid) {
        claimedServerIds.add(persisted);
        continue;
      }
      delete next[localPlot.id];
    }

    const resolved = resolveConfirmedServerPlotIdForLocal(localPlot, backendPlots, next, {
      localPlotIds,
    });
    if (resolved) {
      if (claimedServerIds.has(resolved)) {
        // Another local plot already claimed this server id in this pass —
        // do not double-link. The unlinked local plot will retry on the next
        // sync once the claimed plot is uploaded or the server row is gone.
        continue;
      }
      next[localPlot.id] = resolved;
      claimedServerIds.add(resolved);
    }
  }

  return next;
}

import type { Plot } from '@/features/state/AppStateContext';
import { ensureFieldProducerBootstrapped } from '@/features/api/fieldAppBootstrap';
import {
  buildGeometryFromLocalPlot,
  postPlotToBackend,
  updatePlotMetadataOnBackend,
} from '@/features/api/postPlot';
import { enqueuePlotDependentSyncActions, enqueueProducerSupportingEvidenceSync } from '@/features/sync/enqueuePlotDependentSyncActions';
import { fetchBackendPlotsForSyncScope } from '@/features/sync/resolveFieldSyncScope';
import { invalidateServerPlotFetchCache } from '@/features/sync/serverPlotFetchCache';
import { invalidateServerPlotListCache } from '@/features/sync/serverPlotListCache';
import {
  assessPlotGeometryQuality,
  localPlotRefsForGeometry,
  resolvePlotUploadBlockMessage,
} from '@/features/compliance/plotGeometryQuality';
import { createTranslator, type TranslateFn } from '@/features/i18n/translate';
import { defaultLocale, isSupportedLanguage } from '@/features/i18n/config';
import { getSetting } from '@/features/state/persistence';
import { loadPlotCadastralKey, loadPlotServerLinks, persistPlotServerLinks, savePlotServerLink } from '@/features/state/persistence';
import {
  resolveConfirmedServerPlotIdForLocal,
  reconcilePlotServerLinks,
  serverPlotRowOwnedByLocalDevice,
} from '@/features/plots/plotServerLink';
import { resolveClientPlotId } from '@/features/plots/clientPlotId';
import { backendRowMatchesLocalClientId, findServerPlotForSyncConfirmation } from '@/features/plots/backendPlotMatch';
import { mapPlotUploadErrorMessage } from '@/features/errors/mapApiErrorToUserMessage';
import { listUnsyncedLocalPlots } from '@/features/sync/plotSyncPending';

export { listUnsyncedLocalPlots } from '@/features/sync/plotSyncPending';
export { isLocalPlotConfirmedOnServer } from '@/features/sync/plotSyncPending';

const PLOT_UPLOAD_GAP_MS = 400;
const LANG_STORAGE_KEY = 'tracebudAppLanguage';

async function queuePlotDependentSyncAfterUpload(localPlotId: string, farmerId: string): Promise<void> {
  await enqueuePlotDependentSyncActions({ localPlotId, farmerId }).catch(() => undefined);
  await enqueueProducerSupportingEvidenceSync({ farmerId }).catch(() => undefined);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function reconcileOrphanServerPlotLink(params: {
  plot: Plot;
  backendPlots: unknown[];
  plotServerLinks: Record<string, string>;
  localPlotIds: ReadonlySet<string>;
}): Promise<{ linked: boolean; serverPlotId?: string; plotServerLinks: Record<string, string> }> {
  const match = findServerPlotForSyncConfirmation(
    {
      id: params.plot.id,
      name: params.plot.name,
      areaHectares: params.plot.areaHectares,
      kind: params.plot.kind,
    },
    params.backendPlots,
    params.localPlotIds,
  );
  if (match?.id == null) {
    return { linked: false, plotServerLinks: params.plotServerLinks };
  }

  const serverPlotId = String(match.id);
  if (params.plotServerLinks[params.plot.id]?.trim() === serverPlotId) {
    return { linked: false, plotServerLinks: params.plotServerLinks };
  }
  const clientPlotId = resolveClientPlotId(params.plot);
  try {
    await updatePlotMetadataOnBackend({
      plotId: serverPlotId,
      name: params.plot.name?.trim() || undefined,
      clientPlotId,
      reason: 'field_sync_reconcile_client_plot_id',
    });
  } catch {
    // Link locally even when metadata PATCH fails — avoids duplicate POST storms.
  }
  await savePlotServerLink(params.plot.id, serverPlotId);
  return {
    linked: true,
    serverPlotId,
    plotServerLinks: { ...params.plotServerLinks, [params.plot.id]: serverPlotId },
  };
}

async function ensureServerPlotClientIdentity(params: {
  plot: Plot;
  serverPlotId: string;
}): Promise<void> {
  try {
    await updatePlotMetadataOnBackend({
      plotId: params.serverPlotId,
      name: params.plot.name?.trim() || undefined,
      clientPlotId: resolveClientPlotId(params.plot),
      reason: 'field_sync_after_upload',
    });
  } catch {
    // Upload succeeded; identity backfill is best-effort for idempotency on later syncs.
  }
}

function uploadGeometryQualityError(
  plot: Plot,
  localPlots: Plot[],
  t: TranslateFn,
): string | null {
  if (plot.points.length === 0) return null;
  const quality = assessPlotGeometryQuality({
    kind: plot.kind,
    points: plot.points,
    areaHa: plot.areaHectares,
    otherPlots: localPlotRefsForGeometry(localPlots, plot.id),
    excludePlotId: plot.id,
    phase: 'upload',
  });
  if (quality.blockingIssues.length === 0) return null;

  const block = resolvePlotUploadBlockMessage({
    plotName: plot.name?.trim() || plot.id,
    issues: quality.blockingIssues,
    t,
  });
  if (!block) return null;
  return block.message;
}

async function resolveTranslator(t?: TranslateFn): Promise<TranslateFn> {
  if (t) return t;
  try {
    const stored = await getSetting(LANG_STORAGE_KEY);
    if (stored && isSupportedLanguage(stored)) {
      return createTranslator(stored);
    }
  } catch {
    // ignore
  }
  return createTranslator(defaultLocale);
}

/** Server row when stable client id (persisted link, or legacy name/area match). */
export function backendHasMatchingPlot(
  localPlot: Plot,
  backendPlots: unknown[],
  plotServerLinks?: Record<string, string> | null,
): boolean {
  return (
    resolveConfirmedServerPlotIdForLocal(
      {
        id: localPlot.id,
        name: localPlot.name,
        areaHectares: localPlot.areaHectares,
        kind: localPlot.kind,
      },
      backendPlots,
      plotServerLinks,
    ) != null
  );
}

const syncListeners = new Set<() => void>();

export type UploadUnsyncedPlotsResult = {
  uploaded: number;
  /** Local plots that had no server row before this run (attempt set). */
  unsyncedBefore: number;
  failed: number;
  /** First backend/network failure message for easier debugging in Settings. */
  firstError?: string;
  fetchFailed: boolean;
  stoppedForAuth: boolean;
  /** Display names pushed to server for already-synced plots. */
  namesUpdated?: number;
};

/** Subscribe to be notified after server plot list may have changed (e.g. auto-upload). */
export function subscribeServerPlotSyncChanged(listener: () => void): () => void {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
}

export function emitServerPlotSyncChanged(): void {
  for (const l of syncListeners) {
    try {
      l();
    } catch {
      // ignore
    }
  }
}

/** Fetch server plots across owned farmer ids and refresh local↔server link table. */
export async function warmPlotServerLinksForSync(params: {
  farmerId: string;
  ownedFarmerIds?: string[];
  localPlots: Plot[];
}): Promise<void> {
  const farmerId = params.farmerId.trim();
  if (!farmerId) return;

  await ensureFieldProducerBootstrapped(farmerId);

  let backendPlots: unknown[] = [];
  try {
    backendPlots = await fetchBackendPlotsForSyncScope({
      farmerId,
      ownedFarmerIds: params.ownedFarmerIds,
    });
  } catch {
    return;
  }

  const existing = (await loadPlotServerLinks().catch(() => ({}))) as Record<string, string>;
  const reconciled = reconcilePlotServerLinks(params.localPlots, backendPlots, existing);
  if (
    Object.keys(reconciled).length !== Object.keys(existing).length ||
    Object.entries(reconciled).some(([localId, serverId]) => existing[localId] !== serverId)
  ) {
    await persistPlotServerLinks(reconciled).catch(() => undefined);
  }
}

async function syncPlotDisplayNamesOnServer(params: {
  localPlots: Plot[];
  backendPlots: unknown[];
  plotServerLinks: Record<string, string>;
}): Promise<number> {
  let updated = 0;
  for (const plot of params.localPlots) {
    const displayName = plot.name?.trim();
    if (!displayName) continue;

    const serverId =
      params.plotServerLinks[plot.id]?.trim() ??
      resolveConfirmedServerPlotIdForLocal(
        {
          id: plot.id,
          name: plot.name,
          areaHectares: plot.areaHectares,
          kind: plot.kind,
        },
        params.backendPlots,
        params.plotServerLinks,
      );
    if (!serverId) continue;

    const row = (params.backendPlots as { id?: unknown; name?: string; client_plot_id?: string | null }[]).find(
      (entry) => String(entry?.id ?? '') === serverId,
    );
    if (!row) continue;
    if (!serverPlotRowOwnedByLocalDevice(row, plot.id)) continue;

    const serverName = String(row.name ?? '').trim();
    const needsNameUpdate = serverName !== displayName;
    const needsClientIdBackfill =
      !String(row.client_plot_id ?? '').trim() && serverName === plot.id;
    if (!needsNameUpdate && !needsClientIdBackfill) continue;

    try {
      await updatePlotMetadataOnBackend({
        plotId: serverId,
        name: needsNameUpdate ? displayName : undefined,
        clientPlotId: needsClientIdBackfill ? plot.id : undefined,
        reason: 'sync_display_name',
      });
      updated += 1;
    } catch {
      // Best-effort; upload path remains primary for missing plots.
    }
  }
  return updated;
}

/**
 * Fetches server plots, uploads any local plots that are missing on the server.
 * Safe to call repeatedly; uses the same payload as the manual “Upload plot” action.
 */
export async function uploadUnsyncedPlotsForFarmer(params: {
  farmerId: string;
  localPlots: Plot[];
  /** Device profile name — pushed to user_account on the server during sync. */
  farmerDisplayName?: string;
  /** Merges server plots from every owned profile (auth uid vs linked farmer id). */
  ownedFarmerIds?: string[];
  /** When provided (e.g. Settings sync), uses active UI language for error strings. */
  t?: TranslateFn;
  /** Use `settings` when sync runs from Settings (Sync now is above the status message). */
  surface?: 'settings' | 'default';
}): Promise<UploadUnsyncedPlotsResult> {
  const { farmerId, localPlots } = params;
  const t = await resolveTranslator(params.t);
  const surface = params.surface ?? 'default';

  if (localPlots.length === 0) {
    return { uploaded: 0, unsyncedBefore: 0, failed: 0, fetchFailed: false, stoppedForAuth: false };
  }

  await ensureFieldProducerBootstrapped(farmerId, {
    fullName: params.farmerDisplayName,
  });

  let backendPlots: unknown[];
  let plotServerLinks: Record<string, string>;
  try {
    plotServerLinks = await loadPlotServerLinks();
    invalidateServerPlotFetchCache();
    backendPlots = await fetchBackendPlotsForSyncScope({
      farmerId,
      ownedFarmerIds: params.ownedFarmerIds,
    });
    const reconciled = reconcilePlotServerLinks(localPlots, backendPlots ?? [], plotServerLinks);
    await persistPlotServerLinks(reconciled);
    plotServerLinks = reconciled;
  } catch (e) {
    return {
      uploaded: 0,
      unsyncedBefore: 0,
      failed: 0,
      fetchFailed: true,
      stoppedForAuth: false,
      firstError: e instanceof Error ? e.message : String(e),
    };
  }

  const namesUpdated = await syncPlotDisplayNamesOnServer({
    localPlots,
    backendPlots: backendPlots ?? [],
    plotServerLinks,
  });
  if (namesUpdated > 0) {
    invalidateServerPlotFetchCache();
    invalidateServerPlotListCache();
    try {
      backendPlots = await fetchBackendPlotsForSyncScope({
        farmerId,
        ownedFarmerIds: params.ownedFarmerIds,
      });
    } catch {
      // UI refresh is best-effort.
    }
    emitServerPlotSyncChanged();
  }

  const localPlotIds = new Set(localPlots.map((plot) => plot.id));
  let orphanLinksSaved = false;
  for (const plot of localPlots) {
    const orphanLink = await reconcileOrphanServerPlotLink({
      plot,
      backendPlots: backendPlots ?? [],
      plotServerLinks,
      localPlotIds,
    });
    if (orphanLink.linked) {
      orphanLinksSaved = true;
      plotServerLinks = orphanLink.plotServerLinks;
    }
  }
  if (orphanLinksSaved) {
    await persistPlotServerLinks(plotServerLinks).catch(() => undefined);
    invalidateServerPlotListCache();
  }

  const unsynced = listUnsyncedLocalPlots(localPlots, backendPlots ?? [], plotServerLinks);
  if (unsynced.length === 0) {
    return {
      uploaded: 0,
      unsyncedBefore: 0,
      failed: 0,
      fetchFailed: false,
      stoppedForAuth: false,
      namesUpdated,
    };
  }

  let uploaded = 0;
  let failed = 0;
  let firstError: string | undefined;
  let stoppedForAuth = false;

  for (const plot of unsynced) {
    let cadastralKey: string | null = null;
    try {
      cadastralKey = await loadPlotCadastralKey(plot.id);
    } catch {
      cadastralKey = null;
    }
    const ck = cadastralKey?.trim() ? cadastralKey.trim() : null;

    const geometryQualityError = uploadGeometryQualityError(plot, localPlots, t);
    if (geometryQualityError) {
      failed += 1;
      firstError = firstError ?? geometryQualityError;
      continue;
    }

    const orphanLink = await reconcileOrphanServerPlotLink({
      plot,
      backendPlots: backendPlots ?? [],
      plotServerLinks,
      localPlotIds,
    });
    if (orphanLink.linked) {
      uploaded += 1;
      plotServerLinks = orphanLink.plotServerLinks;
      await queuePlotDependentSyncAfterUpload(plot.id, farmerId);
      if (uploaded < unsynced.length) {
        await sleep(PLOT_UPLOAD_GAP_MS);
      }
      continue;
    }

    let geometry;
    try {
      geometry = buildGeometryFromLocalPlot(plot, {
        declaredAreaHectares: plot.declaredAreaHectares ?? plot.areaHectares ?? null,
      });
    } catch {
      failed += 1;
      firstError = firstError ?? t('sync_plot_invalid_geometry', { name: plot.name });
      continue;
    }

    const r = await postPlotToBackend({
      farmerId,
      clientPlotId: resolveClientPlotId(plot),
      name: plot.name?.trim() || undefined,
      geometry,
      declaredAreaHa: plot.declaredAreaHectares ?? plot.areaHectares ?? null,
      precisionMeters: plot.precisionMetersAtSave ?? null,
      cadastralKey: ck,
      geometryCapture: plot.geometryCapture ?? null,
    });

    if (r.ok) {
      uploaded += 1;
      if (r.serverPlotId) {
        await ensureServerPlotClientIdentity({ plot, serverPlotId: r.serverPlotId });
        await savePlotServerLink(plot.id, r.serverPlotId);
        plotServerLinks = { ...plotServerLinks, [plot.id]: r.serverPlotId };
        await queuePlotDependentSyncAfterUpload(plot.id, farmerId);
      } else {
        try {
          const refreshed = await fetchBackendPlotsForSyncScope({
            farmerId,
            ownedFarmerIds: params.ownedFarmerIds,
          });
          const existing = (refreshed as { id?: unknown; client_plot_id?: string | null; name?: string }[]).find(
            (row) => backendRowMatchesLocalClientId(row, plot.id),
          );
          if (existing?.id != null) {
            const serverPlotId = String(existing.id);
            await ensureServerPlotClientIdentity({ plot, serverPlotId });
            await savePlotServerLink(plot.id, serverPlotId);
            plotServerLinks = { ...plotServerLinks, [plot.id]: serverPlotId };
            await queuePlotDependentSyncAfterUpload(plot.id, farmerId);
          }
        } catch {
          // Response omitted id; next sync pass will reconcile orphans.
        }
      }
      if (uploaded < unsynced.length) {
        await sleep(PLOT_UPLOAD_GAP_MS);
      }
      continue;
    }

    if (r.statusCode === 409 || r.statusCode === 500) {
      try {
        const refreshed = await fetchBackendPlotsForSyncScope({
          farmerId,
          ownedFarmerIds: params.ownedFarmerIds,
        });
        const existing = (refreshed as { id?: unknown; client_plot_id?: string | null; name?: string }[]).find(
          (row) => backendRowMatchesLocalClientId(row, plot.id),
        );
        if (existing?.id != null) {
          const serverPlotId = String(existing.id);
          uploaded += 1;
          await savePlotServerLink(plot.id, serverPlotId);
          plotServerLinks = { ...plotServerLinks, [plot.id]: serverPlotId };
          await queuePlotDependentSyncAfterUpload(plot.id, farmerId);
          if (uploaded < unsynced.length) {
            await sleep(PLOT_UPLOAD_GAP_MS);
          }
          continue;
        }
      } catch {
        // fall through to error handling
      }
    }
    if (r.reason === 'no_access_token') {
      stoppedForAuth = true;
      firstError = firstError ?? t('sync_no_access_token_plot');
      break;
    }
    failed += 1;
    firstError =
      firstError ??
      mapPlotUploadErrorMessage(r.message, t, {
        reason: r.reason,
        statusCode: r.statusCode,
        surface,
      });
    if (r.statusCode === 429) {
      break;
    }
  }

  if (uploaded > 0) {
    invalidateServerPlotFetchCache();
    invalidateServerPlotListCache();
    try {
      backendPlots = await fetchBackendPlotsForSyncScope({
        farmerId,
        ownedFarmerIds: params.ownedFarmerIds,
      });
      const reconciled = reconcilePlotServerLinks(localPlots, backendPlots ?? [], plotServerLinks);
      await persistPlotServerLinks(reconciled);
    } catch {
      // Links saved per-plot above; list refresh is best-effort.
    }
    emitServerPlotSyncChanged();
  }

  return {
    uploaded,
    unsyncedBefore: unsynced.length,
    failed,
    firstError,
    fetchFailed: false,
    stoppedForAuth,
    namesUpdated,
  };
}

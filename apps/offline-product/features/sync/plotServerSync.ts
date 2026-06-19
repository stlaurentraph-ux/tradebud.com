import type { Plot } from '@/features/state/AppStateContext';
import { ensureFieldProducerBootstrapped } from '@/features/api/fieldAppBootstrap';
import {
  buildGeometryFromLocalPlot,
  postPlotToBackend,
} from '@/features/api/postPlot';
import { fetchBackendPlotsForSyncScope } from '@/features/sync/resolveFieldSyncScope';
import { invalidateServerPlotFetchCache } from '@/features/sync/serverPlotFetchCache';
import { invalidateServerPlotListCache } from '@/features/sync/serverPlotListCache';
import {
  assessPlotGeometryQuality,
  localPlotRefsForGeometry,
  localPolygonQualityMessage,
} from '@/features/compliance/plotGeometryQuality';
import { createTranslator, type TranslateFn } from '@/features/i18n/translate';
import { defaultLocale, isSupportedLanguage } from '@/features/i18n/config';
import { getSetting } from '@/features/state/persistence';
import { loadPlotCadastralKey, loadPlotServerLinks, persistPlotServerLinks, savePlotServerLink } from '@/features/state/persistence';
import { resolveServerPlotIdForLocal, reconcilePlotServerLinks } from '@/features/plots/plotServerLink';
import { resolveClientPlotId } from '@/features/plots/clientPlotId';
import { mapPlotUploadErrorMessage } from '@/features/errors/mapApiErrorToUserMessage';

const PLOT_UPLOAD_GAP_MS = 400;
const LANG_STORAGE_KEY = 'tracebudAppLanguage';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  if (quality.allIssues.length === 0) return null;
  return t('sync_plot_geometry_block', {
    name: plot.name,
    message: localPolygonQualityMessage(quality.allIssues, t),
  });
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
    resolveServerPlotIdForLocal(
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

export function listUnsyncedLocalPlots(
  localPlots: Plot[],
  backendPlots: unknown[],
  plotServerLinks?: Record<string, string> | null,
): Plot[] {
  return localPlots.filter((p) => !backendHasMatchingPlot(p, backendPlots, plotServerLinks));
}

const syncListeners = new Set<() => void>();

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

export type UploadUnsyncedPlotsResult = {
  uploaded: number;
  /** Local plots that had no server row before this run (attempt set). */
  unsyncedBefore: number;
  failed: number;
  /** First backend/network failure message for easier debugging in Settings. */
  firstError?: string;
  fetchFailed: boolean;
  stoppedForAuth: boolean;
};

/**
 * Fetches server plots, uploads any local plots that are missing on the server.
 * Safe to call repeatedly; uses the same payload as the manual “Upload plot” action.
 */
export async function uploadUnsyncedPlotsForFarmer(params: {
  farmerId: string;
  localPlots: Plot[];
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

  await ensureFieldProducerBootstrapped(farmerId);

  let backendPlots: unknown[];
  let plotServerLinks: Record<string, string>;
  try {
    plotServerLinks = await loadPlotServerLinks();
    backendPlots = await fetchBackendPlotsForSyncScope({
      farmerId,
      ownedFarmerIds: params.ownedFarmerIds,
    });
    const reconciled = reconcilePlotServerLinks(localPlots, backendPlots ?? [], plotServerLinks);
    await persistPlotServerLinks(reconciled);
    plotServerLinks = reconciled;
  } catch (e) {
    plotServerLinks = await loadPlotServerLinks().catch(() => ({}));
    backendPlots = [];
    if (Object.keys(plotServerLinks).length === 0) {
      return {
        uploaded: 0,
        unsyncedBefore: 0,
        failed: 0,
        fetchFailed: true,
        stoppedForAuth: false,
        firstError: e instanceof Error ? e.message : String(e),
      };
    }
  }

  const unsynced = listUnsyncedLocalPlots(localPlots, backendPlots ?? [], plotServerLinks);
  if (unsynced.length === 0) {
    return { uploaded: 0, unsyncedBefore: 0, failed: 0, fetchFailed: false, stoppedForAuth: false };
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
      geometry,
      declaredAreaHa: plot.declaredAreaHectares ?? plot.areaHectares ?? null,
      precisionMeters: plot.precisionMetersAtSave ?? null,
      cadastralKey: ck,
      geometryCapture: plot.geometryCapture ?? null,
    });

    if (r.ok) {
      uploaded += 1;
      if (r.serverPlotId) {
        await savePlotServerLink(plot.id, r.serverPlotId);
        plotServerLinks = { ...plotServerLinks, [plot.id]: r.serverPlotId };
      }
      if (uploaded < unsynced.length) {
        await sleep(PLOT_UPLOAD_GAP_MS);
      }
      continue;
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
  };
}

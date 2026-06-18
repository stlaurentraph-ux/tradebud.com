import type { Plot } from '@/features/state/AppStateContext';
import {
  buildGeometryFromLocalPlot,
  fetchPlotsForFarmer,
  postPlotToBackend,
} from '@/features/api/postPlot';
import {
  assessLocalPolygonQuality,
  localPolygonQualityMessage,
} from '@/features/compliance/plotGeometryQuality';
import { createTranslator, type TranslateFn } from '@/features/i18n/translate';
import { defaultLocale, isSupportedLanguage } from '@/features/i18n/config';
import { getSetting } from '@/features/state/persistence';
import { loadPlotCadastralKey } from '@/features/state/persistence';
import { findBackendPlotForLocal } from '@/features/plots/backendPlotMatch';
import { resolveClientPlotId } from '@/features/plots/clientPlotId';
import { mapPlotUploadErrorMessage } from '@/features/errors/mapApiErrorToUserMessage';

const LANG_STORAGE_KEY = 'tracebudAppLanguage';

function polygonPlotRefs(plots: Plot[], excludePlotId?: string) {
  return plots
    .filter((p) => p.kind === 'polygon' && p.points.length >= 3 && p.id !== excludePlotId)
    .map((p) => ({
      id: p.id,
      name: p.name,
      points: p.points,
      areaHectares: p.areaHectares,
    }));
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

function uploadGeometryQualityError(
  plot: Plot,
  localPlots: Plot[],
  t: TranslateFn,
): string | null {
  if (plot.kind !== 'polygon' || plot.points.length < 3) return null;
  const quality = assessLocalPolygonQuality({
    points: plot.points,
    areaHa: plot.areaHectares,
    otherPlots: polygonPlotRefs(localPlots, plot.id),
    excludePlotId: plot.id,
    phase: 'upload',
  });
  if (quality.allIssues.length === 0) return null;
  return t('sync_plot_geometry_block', {
    name: plot.name,
    message: localPolygonQualityMessage(quality.allIssues, t),
  });
}

/** Server row when stable client id (or legacy display name) matches. */
export function backendHasMatchingPlot(localPlot: Plot, backendPlots: unknown[]): boolean {
  return (
    findBackendPlotForLocal(
      {
        id: localPlot.id,
        name: localPlot.name,
        areaHectares: localPlot.areaHectares,
        kind: localPlot.kind,
      },
      backendPlots,
    ) != null
  );
}

export function listUnsyncedLocalPlots(localPlots: Plot[], backendPlots: unknown[]): Plot[] {
  return localPlots.filter((p) => !backendHasMatchingPlot(p, backendPlots));
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
  /** When provided (e.g. Settings sync), uses active UI language for error strings. */
  t?: TranslateFn;
  /** Use `settings` when sync runs from Settings so copy says "tap Sync Now below". */
  surface?: 'settings' | 'default';
}): Promise<UploadUnsyncedPlotsResult> {
  const { farmerId, localPlots } = params;
  const t = await resolveTranslator(params.t);
  const surface = params.surface ?? 'default';

  if (localPlots.length === 0) {
    return { uploaded: 0, unsyncedBefore: 0, failed: 0, fetchFailed: false, stoppedForAuth: false };
  }

  let backendPlots: unknown[];
  try {
    backendPlots = await fetchPlotsForFarmer(farmerId);
  } catch {
    return { uploaded: 0, unsyncedBefore: 0, failed: 0, fetchFailed: true, stoppedForAuth: false };
  }

  const unsynced = listUnsyncedLocalPlots(localPlots, backendPlots ?? []);
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
  }

  if (uploaded > 0) {
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

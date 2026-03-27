import type { Plot } from '@/features/state/AppStateContext';
import {
  buildGeometryFromLocalPlot,
  fetchPlotsForFarmer,
  postPlotToBackend,
} from '@/features/api/postPlot';
import { loadPlotCadastralKey } from '@/features/state/persistence';

/** Same matching rule as My Plots: server row `name` equals local plot display name. */
export function backendHasMatchingPlot(localPlot: Plot, backendPlots: unknown[]): boolean {
  const name = String(localPlot.name ?? '');
  return (backendPlots as { name?: string }[]).some((p) => String(p?.name ?? '') === name);
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
}): Promise<UploadUnsyncedPlotsResult> {
  const { farmerId, localPlots } = params;
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

    let geometry;
    try {
      geometry = buildGeometryFromLocalPlot(plot);
    } catch {
      failed += 1;
      firstError = firstError ?? `Plot "${plot.name}" has invalid geometry.`;
      continue;
    }

    const r = await postPlotToBackend({
      farmerId,
      clientPlotId: plot.name,
      geometry,
      declaredAreaHa: plot.declaredAreaHectares ?? plot.areaHectares ?? null,
      precisionMeters: plot.precisionMetersAtSave ?? null,
      cadastralKey: ck,
    });

    if (r.ok) {
      uploaded += 1;
      continue;
    }
    if (r.reason === 'no_access_token') {
      stoppedForAuth = true;
      firstError = firstError ?? 'No access token. Sign in again under Settings.';
      break;
    }
    failed += 1;
    firstError = firstError ?? r.message ?? `Upload failed for plot "${plot.name}".`;
    // network_error / server_error: try remaining plots (e.g. one bad geometry)
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

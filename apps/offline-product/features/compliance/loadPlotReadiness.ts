import { fetchPlotTenureVerification } from '@/features/api/postPlot';
import { computePlotReadinessChecklist, type PlotReadinessChecklist } from '@/features/compliance/plotChecklist';
import { findBackendPlotForLocal } from '@/features/plots/backendPlotMatch';
import type { Plot } from '@/features/state/AppStateContext';
import {
  loadEvidenceForPlot,
  loadPhotosForPlot,
  loadTitlePhotosForPlot,
} from '@/features/state/persistence';

type BackendPlotMatchMeta = {
  id?: unknown;
  sinaph_overlap?: boolean;
  indigenous_overlap?: boolean;
  status?: string;
};

export type PlotReadinessLoadResult = {
  plotId: string;
  done: boolean;
  photoCount: number;
  checklist: PlotReadinessChecklist;
};

/** Same inputs as plot detail — local evidence + tenure verification when synced. */
export async function loadPlotReadinessForLocalPlot(
  plot: Plot,
  backendPlots: unknown[],
): Promise<PlotReadinessLoadResult> {
  const backendMatch = findBackendPlotForLocal(plot, backendPlots) as BackendPlotMatchMeta | null;
  const backendPlotId = backendMatch?.id != null ? String(backendMatch.id) : null;

  const [photos, titleRows, evidenceRows, tenureVerifications] = await Promise.all([
    loadPhotosForPlot(plot.id).catch(() => []),
    loadTitlePhotosForPlot(plot.id).catch(() => []),
    loadEvidenceForPlot(plot.id).catch(() => []),
    backendPlotId
      ? fetchPlotTenureVerification(backendPlotId).catch(() => [])
      : Promise.resolve([]),
  ]);

  const evidenceKinds = evidenceRows
    .map((e: { kind?: string }) => e.kind)
    .filter((k): k is string => typeof k === 'string' && k.length > 0);

  const checklist = computePlotReadinessChecklist({
    groundTruthPhotos: photos,
    plot,
    titlePhotoCount: titleRows.length,
    evidenceKinds,
    isSyncedToServer: Boolean(backendMatch),
    backendFlags: backendMatch,
    tenureVerifications,
  });

  return {
    plotId: plot.id,
    done: checklist.done,
    photoCount: photos.length,
    checklist,
  };
}

export async function loadAllPlotReadinessStates(
  plots: Plot[],
  backendPlots: unknown[],
): Promise<PlotReadinessLoadResult[]> {
  return Promise.all(plots.map((p) => loadPlotReadinessForLocalPlot(p, backendPlots)));
}

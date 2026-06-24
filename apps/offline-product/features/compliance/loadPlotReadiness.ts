import { fetchPlotTenureVerification } from '@/features/api/postPlot';
import { producerEvidenceScopeId } from '@/features/evidence/evidenceScope';
import { hasProducerAttestationsComplete } from '@/features/compliance/farmerDeclarations';
import { computePlotReadinessChecklist, type PlotReadinessChecklist } from '@/features/compliance/plotChecklist';
import { findBackendPlotForLocal } from '@/features/plots/backendPlotMatch';
import { getSyncQueueLockSnapshot } from '@/features/sync/syncQueueMutex';
import type { Plot, FarmerProfile } from '@/features/state/AppStateContext';
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
  titlePhotoCount: number;
  evidenceCount: number;
  checklist: PlotReadinessChecklist;
};

/** Same inputs as plot detail — local evidence + tenure verification when synced. */
export async function loadPlotReadinessForLocalPlot(
  plot: Plot,
  backendPlots: unknown[],
  farmer?: { id: string; fpicConsent?: boolean; laborNoChildLabor?: boolean; laborNoForcedLabor?: boolean; selfDeclared?: boolean } | null,
): Promise<PlotReadinessLoadResult> {
  const backendMatch = findBackendPlotForLocal(plot, backendPlots) as BackendPlotMatchMeta | null;
  const backendPlotId = backendMatch?.id != null ? String(backendMatch.id) : null;
  const skipTenureFetch = getSyncQueueLockSnapshot().locked;

  const [photos, titleRows, evidenceRows, producerEvidenceRows, tenureVerifications] = await Promise.all([
    loadPhotosForPlot(plot.id).catch(() => []),
    loadTitlePhotosForPlot(plot.id).catch(() => []),
    loadEvidenceForPlot(plot.id).catch(() => []),
    farmer?.id
      ? loadEvidenceForPlot(producerEvidenceScopeId(farmer.id)).catch(() => [])
      : Promise.resolve([]),
    backendPlotId && !skipTenureFetch
      ? fetchPlotTenureVerification(backendPlotId).catch(() => [])
      : Promise.resolve([]),
  ]);

  const evidenceKinds = evidenceRows
    .map((e: { kind?: string }) => e.kind)
    .filter((k): k is string => typeof k === 'string' && k.length > 0);
  const producerEvidenceKinds = producerEvidenceRows
    .map((e: { kind?: string }) => e.kind)
    .filter((k): k is string => typeof k === 'string' && k.length > 0);

  const checklist = computePlotReadinessChecklist({
    groundTruthPhotos: photos,
    plot,
    titlePhotoCount: titleRows.length,
    evidenceKinds,
    producerEvidenceKinds,
    producerAttestationsComplete: hasProducerAttestationsComplete(
      farmer ? ({ ...farmer, role: 'farmer' } as FarmerProfile) : undefined,
    ),
    isSyncedToServer: Boolean(backendMatch),
    backendFlags: backendMatch,
    tenureVerifications,
  });

  return {
    plotId: plot.id,
    done: checklist.done,
    photoCount: photos.length,
    titlePhotoCount: titleRows.length,
    evidenceCount: evidenceRows.length,
    checklist,
  };
}

export async function loadAllPlotReadinessStates(
  plots: Plot[],
  backendPlots: unknown[],
  farmer?: { id: string; fpicConsent?: boolean; laborNoChildLabor?: boolean; laborNoForcedLabor?: boolean; selfDeclared?: boolean } | null,
): Promise<PlotReadinessLoadResult[]> {
  return Promise.all(plots.map((p) => loadPlotReadinessForLocalPlot(p, backendPlots, farmer)));
}

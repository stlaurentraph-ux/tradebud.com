import { fetchPlotTenureVerification } from '@/features/api/postPlot';
import { producerEvidenceScopeId } from '@/features/evidence/evidenceScope';
import { hasProducerAttestationsComplete } from '@/features/compliance/farmerDeclarations';
import { computePlotReadinessChecklist, type PlotReadinessChecklist } from '@/features/compliance/plotChecklist';
import {
  resolveBackendPlotMetaForLocal,
  type PlotServerLinks,
} from '@/features/plots/plotServerLink';
import type { Plot, FarmerProfile } from '@/features/state/AppStateContext';
import {
  loadEvidenceForPlot,
  loadPhotosForPlot,
  loadTitlePhotosForPlot,
} from '@/features/state/persistence';

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
  plotServerLinks?: PlotServerLinks | null,
): Promise<PlotReadinessLoadResult> {
  const backendMeta = resolveBackendPlotMetaForLocal(plot, backendPlots, plotServerLinks ?? {});
  const backendPlotId = backendMeta.id;

  const [photos, titleRows, evidenceRows, producerEvidenceRows, tenureVerifications] = await Promise.all([
    loadPhotosForPlot(plot.id).catch(() => []),
    loadTitlePhotosForPlot(plot.id).catch(() => []),
    loadEvidenceForPlot(plot.id).catch(() => []),
    farmer?.id
      ? loadEvidenceForPlot(producerEvidenceScopeId(farmer.id)).catch(() => [])
      : Promise.resolve([]),
    backendPlotId
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
    isSyncedToServer: Boolean(backendPlotId),
    backendFlags: backendPlotId
      ? { sinaph_overlap: backendMeta.sinaph, indigenous_overlap: backendMeta.indigenous }
      : null,
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
  plotServerLinks?: PlotServerLinks | null,
): Promise<PlotReadinessLoadResult[]> {
  return Promise.all(
    plots.map((p) => loadPlotReadinessForLocalPlot(p, backendPlots, farmer, plotServerLinks)),
  );
}

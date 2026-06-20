import { hasProducerAttestationsComplete } from '@/features/compliance/farmerDeclarations';
import type { PlotReadinessLoadResult } from '@/features/compliance/loadPlotReadiness';
import { countPlotsNeedingValidLandTitle } from '@/features/evidence/plotDocumentSummary';
import { comparePlotsForDisplay } from '@/features/plots/stablePlotDisplayOrder';
import type { FarmerProfile } from '@/features/state/AppStateContext';

export type ProducerDocumentsNextStep =
  | { kind: 'all_set' }
  | { kind: 'attestations' }
  | { kind: 'plot_land'; plotId: string; plotCount: number }
  | { kind: 'producer_files_optional' };

function plotNeedsValidLandTitle(readiness: PlotReadinessLoadResult): boolean {
  const hasLand =
    readiness.titlePhotoCount > 0 ||
    (readiness.checklist.landOk && readiness.evidenceCount > 0);
  if (!hasLand) return true;
  return readiness.checklist.tenureParseGate !== 'cleared';
}

export function resolveProducerDocumentsNextStep(params: {
  farmer?: FarmerProfile | null;
  profileDocCount: number;
  plotReadiness: PlotReadinessLoadResult[];
  plots: { id: string; name: string; createdAt?: number }[];
}): ProducerDocumentsNextStep {
  const attestationsComplete = hasProducerAttestationsComplete(params.farmer ?? undefined);

  if (!attestationsComplete) {
    return { kind: 'attestations' };
  }

  const needsValidLand = countPlotsNeedingValidLandTitle(params.plotReadiness);
  if (needsValidLand > 0 && params.plots.length > 0) {
    const readinessById = Object.fromEntries(params.plotReadiness.map((r) => [r.plotId, r]));
    const first = [...params.plots]
      .filter((p) => {
        const readiness = readinessById[p.id];
        return !readiness || plotNeedsValidLandTitle(readiness);
      })
      .sort(comparePlotsForDisplay)[0];
    if (first) {
      return {
        kind: 'plot_land',
        plotId: first.id,
        plotCount: params.plots.length,
      };
    }
  }

  if (params.profileDocCount === 0) {
    return { kind: 'producer_files_optional' };
  }

  return { kind: 'all_set' };
}

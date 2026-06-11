import type { GfwAlertSummary, PlotComplianceStatus } from './plot-compliance-status';
import { gfwSummaryToPlotStatus } from './plot-compliance-status';

/** Production systems where canopy context can support auto-clear of amber alerts. */
export const AGROFORESTRY_PRODUCTION_SYSTEMS = new Set([
  'agroforestry',
  'shade_grown',
  'silvopasture',
]);

export type GfwContextLayerResult = {
  dataset: string;
  version: string;
  sql: string;
  ok: boolean;
  error?: string;
  values: Record<string, number | null>;
};

export type GfwContextSummary = {
  tropicalTreeCoverAvgPct: number | null;
  tropicalTreeCoverAreaHa: number | null;
  treeCoverLossHa: number | null;
  naturalForestHa: number | null;
};

export type GfwContextSignal = 'unknown' | 'canopy_stable' | 'mixed' | 'loss_confirmed';

export type GfwContextScreening = {
  summary: GfwContextSummary;
  signal: GfwContextSignal;
  layers: GfwContextLayerResult[];
  queriedAt: string;
};

export type GfwContextFusionThresholds = {
  minTropicalCanopyPct: number;
  maxPostCutoffLossHa: number;
};

export const DEFAULT_GFW_CONTEXT_THRESHOLDS: GfwContextFusionThresholds = {
  minTropicalCanopyPct: 30,
  maxPostCutoffLossHa: 0.02,
};

export function emptyGfwContextSummary(): GfwContextSummary {
  return {
    tropicalTreeCoverAvgPct: null,
    tropicalTreeCoverAreaHa: null,
    treeCoverLossHa: null,
    naturalForestHa: null,
  };
}

export function isAgroforestryProductionSystem(productionSystem: string | null | undefined): boolean {
  if (!productionSystem) return false;
  return AGROFORESTRY_PRODUCTION_SYSTEMS.has(productionSystem.trim().toLowerCase());
}

export function gfwContextToSignal(
  summary: GfwContextSummary,
  thresholds: GfwContextFusionThresholds = DEFAULT_GFW_CONTEXT_THRESHOLDS,
): GfwContextSignal {
  const hasTropicalSample =
    summary.tropicalTreeCoverAreaHa != null && summary.tropicalTreeCoverAreaHa > 0;
  const tropicalCanopyOk =
    hasTropicalSample &&
    summary.tropicalTreeCoverAvgPct != null &&
    summary.tropicalTreeCoverAvgPct >= thresholds.minTropicalCanopyPct;
  const lossHa = summary.treeCoverLossHa;
  const lossKnown = lossHa != null;
  const lossLow = lossKnown && lossHa <= thresholds.maxPostCutoffLossHa;
  const lossHigh = lossKnown && lossHa > thresholds.maxPostCutoffLossHa;

  if (lossHigh) {
    return 'loss_confirmed';
  }

  if (tropicalCanopyOk && lossLow) {
    return 'canopy_stable';
  }

  if (lossLow && summary.naturalForestHa != null && summary.naturalForestHa > 0) {
    return 'canopy_stable';
  }

  if (lossKnown || hasTropicalSample || summary.naturalForestHa != null) {
    return 'mixed';
  }

  return 'unknown';
}

/**
 * Downgrades amber alert hits to `compliant` when GFW context layers show stable canopy
 * and the plot is declared agroforestry / shade-grown. Never weakens red alert outcomes.
 */
export function applyGfwContextToPlotStatus(params: {
  alertSummary: GfwAlertSummary;
  context: GfwContextSummary;
  contextSignal: GfwContextSignal;
  productionSystem?: string | null;
  baseStatus?: PlotComplianceStatus;
}): PlotComplianceStatus {
  const baseStatus = params.baseStatus ?? gfwSummaryToPlotStatus(params.alertSummary);
  if (baseStatus !== 'under_review') {
    return baseStatus;
  }
  if (!isAgroforestryProductionSystem(params.productionSystem)) {
    return baseStatus;
  }
  if (params.contextSignal !== 'canopy_stable') {
    return baseStatus;
  }
  return 'compliant';
}

export function contextSupportsAutoReviewClear(params: {
  contextSignal: GfwContextSignal;
  productionSystem?: string | null;
  proposedStatus: PlotComplianceStatus;
}): boolean {
  return (
    params.proposedStatus === 'compliant' &&
    params.contextSignal === 'canopy_stable' &&
    isAgroforestryProductionSystem(params.productionSystem)
  );
}

import type { GfwAlertSummary, PlotComplianceStatus } from './plot-compliance-status';
import { gfwSummaryToPlotStatus } from './plot-compliance-status';
import {
  AGROFORESTRY_PRODUCTION_SYSTEMS,
  isAgroforestryProductionSystem,
} from './gfw-context-fusion';
import type { FdpCommodityThresholds } from './fdp-commodity-profiles';
import { FDP_PILOT_COMMODITY } from './fdp-commodity-profiles';

export type FdpYearStats = {
  mean: number | null;
  p50: number | null;
  p90: number | null;
};

export type FdpCommodityLayerResult = {
  commodity: string;
  year: number;
  dataset: string;
  ok: boolean;
  error?: string;
};

export type FdpCommoditySummary = {
  ok: boolean;
  modelVersion: '2025b';
  commodity: string;
  countryCode: string | null;
  countryLabel: string | null;
  baselineYear: number;
  years: Record<string, FdpYearStats>;
  competingCommodity: string | null;
  competingProbMean: number | null;
  temporalStability: 'stable' | 'emerging' | 'declining' | 'unknown';
  layers: FdpCommodityLayerResult[];
  queriedAt: string;
  skippedReason?: string;
};

export type FdpCommodityScreening = {
  summary: FdpCommoditySummary;
  signal: FdpCommoditySignal;
};

export type FdpCommoditySignal = 'unknown' | 'legitimate' | 'mismatch' | 'emerging';

export type FdpCommodityContextSnapshot = {
  signal: FdpCommoditySignal;
  modelVersion: '2025b';
  commodity: string;
  countryCode: string | null;
  baselineYear: number;
  declaredProbMean: number | null;
  declaredProbP50: number | null;
  competingCommodity: string | null;
  competingProbMean: number | null;
  temporalStability: FdpCommoditySummary['temporalStability'];
  yearsScreened: number[];
  layers: Array<{ commodity: string; year: number; ok: boolean; error?: string }>;
  queriedAt: string;
  skippedReason?: string;
};

export const FDP_BASELINE_YEAR = 2020;
export const FDP_TEMPORAL_YEARS = [2019, 2020, 2021] as const;

export function emptyFdpCommoditySummary(params?: {
  commodity?: string;
  countryCode?: string | null;
  skippedReason?: string;
}): FdpCommoditySummary {
  return {
    ok: false,
    modelVersion: '2025b',
    commodity: params?.commodity ?? FDP_PILOT_COMMODITY,
    countryCode: params?.countryCode ?? null,
    countryLabel: null,
    baselineYear: FDP_BASELINE_YEAR,
    years: {},
    competingCommodity: null,
    competingProbMean: null,
    temporalStability: 'unknown',
    layers: [],
    queriedAt: new Date().toISOString(),
    skippedReason: params?.skippedReason,
  };
}

function yearMean(summary: FdpCommoditySummary, year: number): number | null {
  const stats = summary.years[String(year)];
  return stats?.mean ?? null;
}

export function assessFdpTemporalStability(
  summary: FdpCommoditySummary,
  thresholds: FdpCommodityThresholds,
): FdpCommoditySummary['temporalStability'] {
  const y2019 = yearMean(summary, 2019);
  const y2020 = yearMean(summary, 2020);
  const y2021 = yearMean(summary, 2021);

  if (y2020 == null) return 'unknown';

  if (y2019 != null && y2021 != null) {
    if (y2021 - y2020 >= thresholds.emergingPostCutoffDelta && y2019 < thresholds.preCutoffStableMin) {
      return 'emerging';
    }
    if (Math.abs(y2021 - y2019) <= 0.1 && y2020 >= thresholds.preCutoffStableMin) {
      return 'stable';
    }
    if (y2021 < y2019 - 0.1) {
      return 'declining';
    }
  }

  if (y2019 != null && y2020 >= thresholds.preCutoffStableMin && Math.abs(y2020 - y2019) <= 0.1) {
    return 'stable';
  }

  return 'unknown';
}

export function fdpCommodityToSignal(
  summary: FdpCommoditySummary,
  thresholds: FdpCommodityThresholds,
): FdpCommoditySignal {
  if (!summary.ok) return 'unknown';

  const y2020 = yearMean(summary, FDP_BASELINE_YEAR);
  if (y2020 == null) return 'unknown';

  if (summary.temporalStability === 'emerging') {
    return 'emerging';
  }

  if (summary.competingCommodity && summary.competingProbMean != null) {
    if (y2020 < thresholds.declaredProbMin && summary.competingProbMean >= y2020 + thresholds.mismatchDelta) {
      return 'mismatch';
    }
    if (summary.competingProbMean > y2020 + thresholds.mismatchDelta && summary.competingProbMean >= 0.5) {
      return 'mismatch';
    }
  }

  if (y2020 < thresholds.declaredProbMin) {
    return 'mismatch';
  }

  return 'legitimate';
}

/**
 * Applies FDP commodity legitimacy on top of GFW-derived status.
 * Never weakens `deforestation_detected` or `degradation_risk`.
 */
export function applyFdpCommodityToPlotStatus(params: {
  fdpSignal: FdpCommoditySignal;
  productionSystem?: string | null;
  baseStatus: PlotComplianceStatus;
}): PlotComplianceStatus {
  const base = params.baseStatus;

  if (base === 'deforestation_detected' || base === 'degradation_risk') {
    return base;
  }

  if (params.fdpSignal === 'mismatch' || params.fdpSignal === 'emerging') {
    if (base === 'compliant') return 'under_review';
    return base === 'pending_check' ? 'under_review' : base;
  }

  if (params.fdpSignal === 'legitimate' && base === 'under_review') {
    if (isAgroforestryProductionSystem(params.productionSystem)) {
      return 'compliant';
    }
  }

  return base;
}

export function fdpSupportsAutoReviewClear(params: {
  fdpSignal: FdpCommoditySignal;
  productionSystem?: string | null;
  proposedStatus: PlotComplianceStatus;
}): boolean {
  return (
    params.proposedStatus === 'compliant' &&
    params.fdpSignal === 'legitimate' &&
    isAgroforestryProductionSystem(params.productionSystem)
  );
}

export function screeningSupportsAutoReviewClear(params: {
  gfwContextSignal?: 'unknown' | 'canopy_stable' | 'mixed' | 'loss_confirmed';
  fdpSignal?: FdpCommoditySignal;
  productionSystem?: string | null;
  proposedStatus: PlotComplianceStatus;
}): boolean {
  if (params.proposedStatus !== 'compliant') return false;
  if (!isAgroforestryProductionSystem(params.productionSystem)) return false;

  const gfwOk = params.gfwContextSignal === 'canopy_stable';
  const fdpOk = params.fdpSignal === 'legitimate';
  return gfwOk || fdpOk;
}

export function buildFdpContextSnapshot(screening: FdpCommodityScreening): FdpCommodityContextSnapshot {
  const baseline = screening.summary.years[String(FDP_BASELINE_YEAR)] ?? {
    mean: null,
    p50: null,
    p90: null,
  };

  return {
    signal: screening.signal,
    modelVersion: screening.summary.modelVersion,
    commodity: screening.summary.commodity,
    countryCode: screening.summary.countryCode,
    baselineYear: screening.summary.baselineYear,
    declaredProbMean: baseline.mean,
    declaredProbP50: baseline.p50,
    competingCommodity: screening.summary.competingCommodity,
    competingProbMean: screening.summary.competingProbMean,
    temporalStability: screening.summary.temporalStability,
    yearsScreened: FDP_TEMPORAL_YEARS.slice(),
    layers: screening.summary.layers.map((layer) => ({
      commodity: layer.commodity,
      year: layer.year,
      ok: layer.ok,
      error: layer.error,
    })),
    queriedAt: screening.summary.queriedAt,
    skippedReason: screening.summary.skippedReason,
  };
}

/** Convenience for unit tests — derive base alert status then fuse FDP. */
export function fuseGfwAndFdpPlotStatus(params: {
  alertSummary: GfwAlertSummary;
  fdpSignal: FdpCommoditySignal;
  productionSystem?: string | null;
  gfwContextAdjustedStatus?: PlotComplianceStatus;
}): PlotComplianceStatus {
  const baseStatus = params.gfwContextAdjustedStatus ?? gfwSummaryToPlotStatus(params.alertSummary);
  return applyFdpCommodityToPlotStatus({
    fdpSignal: params.fdpSignal,
    productionSystem: params.productionSystem,
    baseStatus,
  });
}

export { AGROFORESTRY_PRODUCTION_SYSTEMS };

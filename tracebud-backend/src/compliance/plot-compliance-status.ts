/** EUDR deforestation cutoff — Regulation (EU) 2023/1115. */
export const EUDR_DEFORESTATION_CUTOFF = '2020-12-31';

/** Ground-truth photos required before clearing `under_review` to `compliant`. */
export const MIN_GROUND_TRUTH_PHOTOS_FOR_REVIEW_CLEARANCE = 4;

export type PlotComplianceStatus =
  | 'pending_check'
  | 'compliant'
  | 'under_review'
  | 'degradation_risk'
  | 'deforestation_detected';

const STATUS_RANK: Record<PlotComplianceStatus, number> = {
  pending_check: 0,
  compliant: 1,
  under_review: 2,
  degradation_risk: 3,
  deforestation_detected: 4,
};

export type GfwAlertSummary = {
  alertCount: number | null;
  alertAreaHa: number | null;
};

export type GfwSignalTier = 'unknown' | 'green' | 'amber' | 'red';

export function gfwSummaryToSignalTier(summary: GfwAlertSummary): GfwSignalTier {
  if (summary.alertCount == null) return 'unknown';
  if (summary.alertCount === 0) return 'green';
  if (summary.alertAreaHa != null && summary.alertAreaHa < 0.05) return 'amber';
  return 'red';
}

export function gfwSummaryToPlotStatus(summary: GfwAlertSummary): PlotComplianceStatus {
  const tier = gfwSummaryToSignalTier(summary);
  if (tier === 'green') return 'compliant';
  if (tier === 'amber') return 'under_review';
  if (tier === 'red') return 'deforestation_detected';
  return 'pending_check';
}

export type DeforestationScreeningSnapshot = {
  cutoffDate: string;
  alertCount: number | null;
  alertAreaHa: number | null;
  signalTier: GfwSignalTier;
  providerMode: 'glad_s2_primary' | 'radd_fallback' | 'unavailable';
  dataset: string | null;
  version: string | null;
  screenedAt: string;
};

export function overlapToPlotStatus(sinaphOverlap: boolean, indigenousOverlap: boolean): PlotComplianceStatus {
  if (sinaphOverlap && indigenousOverlap) return 'deforestation_detected';
  if (sinaphOverlap || indigenousOverlap) return 'degradation_risk';
  return 'compliant';
}

export function mergePlotComplianceStatus(
  ...statuses: PlotComplianceStatus[]
): PlotComplianceStatus {
  return statuses.reduce<PlotComplianceStatus>((worst, status) => {
    return STATUS_RANK[status] > STATUS_RANK[worst] ? status : worst;
  }, 'pending_check');
}

/**
 * Blocks `under_review` → `compliant` until enough ground-truth photos are synced
 * **and** server-verified inside the plot geography (PostGIS).
 * Satellite must already read clear (proposed `compliant`); amber/red stay blocked upstream.
 */
export function applyReviewClearanceGate(params: {
  proposedStatus: PlotComplianceStatus;
  currentStatus: PlotComplianceStatus | string;
  /** Photos with GPS inside plot and taken after EUDR cutoff. */
  clearanceVerifiedGroundTruthPhotoCount: number;
  minGroundTruthPhotos?: number;
}): PlotComplianceStatus {
  const min = params.minGroundTruthPhotos ?? MIN_GROUND_TRUTH_PHOTOS_FOR_REVIEW_CLEARANCE;
  if (params.proposedStatus !== 'compliant') {
    return params.proposedStatus;
  }
  if (params.currentStatus !== 'under_review') {
    return 'compliant';
  }
  if (params.clearanceVerifiedGroundTruthPhotoCount >= min) {
    return 'compliant';
  }
  return 'under_review';
}

export function verdictToPlotStatus(
  verdict: 'no_deforestation_detected' | 'possible_deforestation_detected' | 'unknown',
  summary: GfwAlertSummary,
): PlotComplianceStatus {
  if (verdict === 'no_deforestation_detected') return 'compliant';
  if (verdict === 'possible_deforestation_detected') {
    return gfwSummaryToPlotStatus(summary);
  }
  return 'pending_check';
}

/** Plot statuses accepted when bundling harvest vouchers into a shipment package. */
export function isPlotDeforestationFreeVerified(plotStatus: string | null | undefined): boolean {
  const normalized = (plotStatus ?? '').trim().toLowerCase();
  return normalized === 'verified' || normalized === 'compliant';
}

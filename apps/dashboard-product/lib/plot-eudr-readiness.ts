import {
  isPlotGeometryCaptureComplete,
  isPlotFieldVerified,
  mapTenantPlotToInventoryRow,
  normalizeComplianceStatus,
  type PlotComplianceStatus,
  type PlotInventoryRow,
} from '@/lib/plot-inventory';
import type { PlotTenureStatusBadge } from '@/lib/plot-tenure-status';

/** Matches backend `MIN_GROUND_TRUTH_PHOTOS_FOR_REVIEW_CLEARANCE`. */
export const PLOT_GROUND_TRUTH_PHOTOS_REQUIRED = 4;

export type PlotEudrReadinessGapId =
  | 'field_capture'
  | 'deforestation_screening'
  | 'tenure'
  | 'evidence'
  | 'ground_truth_photos';

export type PlotEudrReadinessGapSeverity = 'blocking' | 'warning';

export interface PlotEudrReadinessGap {
  id: PlotEudrReadinessGapId;
  severity: PlotEudrReadinessGapSeverity;
  label: string;
  detail: string;
}

export interface PlotEudrReadinessAssessment {
  ready: boolean;
  gaps: PlotEudrReadinessGap[];
}

export interface PlotGroundTruthPhotoSummary {
  clearanceVerifiedCount: number;
  minRequired: number;
  clearanceEligible: boolean;
  totalCount: number;
}

export interface AssessPlotEudrReadinessInput {
  plot: Pick<PlotInventoryRow, 'kind' | 'compliance_status' | 'verified' | 'area_hectares'>;
  tenureBadge: PlotTenureStatusBadge;
  tenureEvidenceCount: number;
  plotEvidenceCount: number;
  groundTruthPhotos: PlotGroundTruthPhotoSummary;
}

function screeningGap(
  status: PlotComplianceStatus,
): PlotEudrReadinessGap | null {
  switch (status) {
    case 'pending_check':
      return {
        id: 'deforestation_screening',
        severity: 'warning',
        label: 'Deforestation screening incomplete',
        detail: 'Satellite screening has not finished or returned an inconclusive result.',
      };
    case 'under_review':
      return {
        id: 'deforestation_screening',
        severity: 'warning',
        label: 'Deforestation screening under review',
        detail: 'An amber screening signal needs human review before this plot is treated as clear.',
      };
    case 'degradation_risk':
      return {
        id: 'deforestation_screening',
        severity: 'blocking',
        label: 'Degradation risk flagged',
        detail: 'Screening flagged degradation risk — resolve before shipment use.',
      };
    case 'deforestation_detected':
      return {
        id: 'deforestation_screening',
        severity: 'blocking',
        label: 'Deforestation signal detected',
        detail: 'Screening detected a deforestation signal at this plot.',
      };
    default:
      return null;
  }
}

function tenureGap(
  badge: PlotTenureStatusBadge,
  tenureEvidenceCount: number,
): PlotEudrReadinessGap | null {
  if (badge === 'formal_documented' || badge === 'producer_in_possession') {
    return null;
  }
  if (badge === 'attestation_only') {
    return {
      id: 'tenure',
      severity: 'warning',
      label: 'Tenure attestation only',
      detail: 'Producer attestation is on file, but no cadastral key or tenure document is linked.',
    };
  }
  return {
    id: 'tenure',
    severity: 'blocking',
    label: 'Tenure documentation missing',
    detail:
      tenureEvidenceCount > 0
        ? 'Tenure files are linked but cadastral or possession path is not established.'
        : 'No cadastral reference, tenure upload, or producer-in-possession declaration.',
  };
}

export function assessPlotEudrReadiness(input: AssessPlotEudrReadinessInput): PlotEudrReadinessAssessment {
  const gaps: PlotEudrReadinessGap[] = [];

  if (!isPlotGeometryCaptureComplete(input.plot)) {
    gaps.push({
      id: 'field_capture',
      severity: 'blocking',
      label: 'Field capture incomplete',
      detail:
        input.plot.kind === 'point'
          ? 'Pin is present but declared area is missing, screening is pending, or polygon is required for 4 ha or more.'
          : 'Walked boundary is missing or still pending compliance review.',
    });
  }

  const screening = screeningGap(input.plot.compliance_status);
  if (screening) gaps.push(screening);

  const tenure = tenureGap(input.tenureBadge, input.tenureEvidenceCount);
  if (tenure) gaps.push(tenure);

  if (input.plotEvidenceCount === 0) {
    gaps.push({
      id: 'evidence',
      severity: 'warning',
      label: 'No plot evidence on file',
      detail: 'Upload tenure, FPIC, or supporting documents in the evidence workspace.',
    });
  }

  if (!input.groundTruthPhotos.clearanceEligible) {
    const missing = Math.max(
      0,
      input.groundTruthPhotos.minRequired - input.groundTruthPhotos.clearanceVerifiedCount,
    );
    gaps.push({
      id: 'ground_truth_photos',
      severity: input.plot.compliance_status === 'under_review' ? 'blocking' : 'warning',
      label: 'Ground-truth photos incomplete',
      detail: `${input.groundTruthPhotos.clearanceVerifiedCount} of ${input.groundTruthPhotos.minRequired} geo-verified field photos after the EUDR cutoff (${missing} still needed).`,
    });
  }

  const ready = gaps.filter((gap) => gap.severity === 'blocking').length === 0 && gaps.length === 0;
  return { ready, gaps };
}

export function buildInventoryRowFromMapPreview(preview: {
  id: string;
  name: string;
  kind: string;
  status: string;
  area_ha: number | null;
  farmer_id?: string;
  farmer_name?: string | null;
}): PlotInventoryRow | null {
  return mapTenantPlotToInventoryRow({
    id: preview.id,
    name: preview.name,
    kind: preview.kind,
    status: preview.status,
    area_ha: preview.area_ha,
    farmer_id: preview.farmer_id,
    farmer_name: preview.farmer_name,
  });
}

export function normalizeGroundTruthPhotoSummary(payload: unknown): PlotGroundTruthPhotoSummary {
  const row =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const clearanceVerifiedCount =
    typeof row.clearance_verified_count === 'number'
      ? row.clearance_verified_count
      : typeof row.clearanceVerifiedCount === 'number'
        ? row.clearanceVerifiedCount
        : 0;
  const minRequired =
    typeof row.min_required === 'number'
      ? row.min_required
      : typeof row.minRequired === 'number'
        ? row.minRequired
        : PLOT_GROUND_TRUTH_PHOTOS_REQUIRED;
  const totalCount =
    typeof row.total_count === 'number'
      ? row.total_count
      : typeof row.totalCount === 'number'
        ? row.totalCount
        : 0;
  const clearanceEligible =
    row.clearance_eligible === true ||
    row.clearanceEligible === true ||
    clearanceVerifiedCount >= minRequired;

  return {
    clearanceVerifiedCount,
    minRequired,
    clearanceEligible,
    totalCount,
  };
}

export function defaultGroundTruthPhotoSummary(): PlotGroundTruthPhotoSummary {
  return {
    clearanceVerifiedCount: 0,
    minRequired: PLOT_GROUND_TRUTH_PHOTOS_REQUIRED,
    clearanceEligible: false,
    totalCount: 0,
  };
}

export function formatDeforestationScreeningStatus(status: string): string {
  const normalized = normalizeComplianceStatus(status);
  switch (normalized) {
    case 'compliant':
      return 'Clear — no deforestation signal';
    case 'pending_check':
      return 'Screening pending';
    case 'under_review':
      return 'Under review';
    case 'degradation_risk':
      return 'Degradation risk';
    case 'deforestation_detected':
      return 'Deforestation signal';
    default:
      return 'Unknown';
  }
}

/** @internal for tests */
export function isPlotFieldVerifiedForReadiness(
  row: Pick<PlotInventoryRow, 'kind' | 'compliance_status'>,
): boolean {
  return isPlotFieldVerified(row.kind, row.compliance_status);
}

import { normalizeComplianceStatus, type PlotComplianceStatus } from '@/lib/plot-inventory';

/** Shown in CRM / plot detail — never implies tenure or full EUDR readiness. */
export const PLOT_STATUS_DATABASE_COLUMN_LABEL = 'Deforestation screening status';

export const PLOT_STATUS_DATABASE_COLUMN_HINT =
  'Satellite (GFW) result only. Does not include land tenure, FPIC, labor, or ground-truth photos. Use EUDR readiness on the plot page for shipment-grade checks.';

const SCREENING_LABELS: Record<PlotComplianceStatus, string> = {
  deforestation_clear: 'Clear — no deforestation signal',
  pending_check: 'Screening pending',
  under_review: 'Under review',
  degradation_risk: 'Degradation / overlap risk',
  deforestation_detected: 'Deforestation signal',
  unknown: 'Unknown',
};

const SCREENING_SHORT_LABELS: Record<PlotComplianceStatus, string> = {
  deforestation_clear: 'Deforestation clear',
  pending_check: 'Screening pending',
  under_review: 'Under review',
  degradation_risk: 'Overlap risk',
  deforestation_detected: 'Flagged',
  unknown: 'Unknown',
};

/** Human label for plot.status / compliance_status in UI. */
export function formatDeforestationScreeningStatus(status: string | null | undefined): string {
  return SCREENING_LABELS[normalizeComplianceStatus(status)];
}

/** Compact badge/table label for deforestation screening only. */
export function formatDeforestationScreeningStatusShort(status: string | null | undefined): string {
  return SCREENING_SHORT_LABELS[normalizeComplianceStatus(status)];
}

/** Tooltip when hovering a screening badge or Supabase enum value. */
export function deforestationScreeningStatusDetail(status: string | null | undefined): string {
  const normalized = normalizeComplianceStatus(status);
  const base = SCREENING_LABELS[normalized];
  if (normalized === 'deforestation_clear') {
    return `${base}. Tenure documents and other EUDR checks are tracked separately.`;
  }
  return `${base}. ${PLOT_STATUS_DATABASE_COLUMN_HINT}`;
}

/** Maps raw DB enum values for Supabase readers. */
export function explainPlotStatusEnumValue(value: string | null | undefined): string {
  const normalized = normalizeComplianceStatus(value);
  if (normalized === 'deforestation_clear') {
    return 'deforestation_clear → no deforestation signal (not full EUDR / tenure compliant)';
  }
  return `${value ?? 'null'} → ${SCREENING_LABELS[normalized]}`;
}

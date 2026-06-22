export type BackendPlotComplianceStatus =
  | 'pending_check'
  | 'deforestation_clear'
  | 'under_review'
  | 'degradation_risk'
  | 'deforestation_detected'
  | string;

/** Legacy plot_status enum value before 2026-06-20 rename. */
const LEGACY_PLOT_STATUS_COMPLIANT = 'compliant';

export type DeforestationUiState = 'passed' | 'under_review' | 'at_risk' | 'alert' | 'pending';

export type DeforestationScreeningContextSummary = {
  signal?: string;
  tropicalTreeCoverAvgPct?: number | null;
  treeCoverLossHa?: number | null;
  naturalForestHa?: number | null;
  contextAdjusted?: boolean;
};

export type DeforestationScreeningSummary = {
  cutoffDate?: string;
  alertCount?: number | null;
  alertAreaHa?: number | null;
  signalTier?: string;
  providerMode?: string;
  dataset?: string | null;
  version?: string | null;
  screenedAt?: string;
  contextAdjusted?: boolean;
  context?: DeforestationScreeningContextSummary;
};

export function normalizeBackendPlotStatus(status: unknown): BackendPlotComplianceStatus {
  const raw = String(status ?? 'pending_check');
  if (raw === LEGACY_PLOT_STATUS_COMPLIANT) return 'deforestation_clear';
  if (
    raw === 'deforestation_clear' ||
    raw === 'under_review' ||
    raw === 'degradation_risk' ||
    raw === 'deforestation_detected' ||
    raw === 'pending_check'
  ) {
    return raw;
  }
  return 'pending_check';
}

export function parseDeforestationScreening(raw: unknown): DeforestationScreeningSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  return {
    cutoffDate: typeof row.cutoffDate === 'string' ? row.cutoffDate : undefined,
    alertCount: typeof row.alertCount === 'number' ? row.alertCount : null,
    alertAreaHa: typeof row.alertAreaHa === 'number' ? row.alertAreaHa : null,
    signalTier: typeof row.signalTier === 'string' ? row.signalTier : undefined,
    providerMode: typeof row.providerMode === 'string' ? row.providerMode : undefined,
    dataset: typeof row.dataset === 'string' ? row.dataset : null,
    version: typeof row.version === 'string' ? row.version : null,
    screenedAt: typeof row.screenedAt === 'string' ? row.screenedAt : undefined,
    contextAdjusted: row.contextAdjusted === true,
    context:
      row.context && typeof row.context === 'object'
        ? {
            signal: typeof (row.context as Record<string, unknown>).signal === 'string'
              ? ((row.context as Record<string, unknown>).signal as string)
              : undefined,
            tropicalTreeCoverAvgPct:
              typeof (row.context as Record<string, unknown>).tropicalTreeCoverAvgPct === 'number'
                ? ((row.context as Record<string, unknown>).tropicalTreeCoverAvgPct as number)
                : null,
            treeCoverLossHa:
              typeof (row.context as Record<string, unknown>).treeCoverLossHa === 'number'
                ? ((row.context as Record<string, unknown>).treeCoverLossHa as number)
                : null,
            naturalForestHa:
              typeof (row.context as Record<string, unknown>).naturalForestHa === 'number'
                ? ((row.context as Record<string, unknown>).naturalForestHa as number)
                : null,
          }
        : undefined,
  };
}

export function deforestationUiStateFromBackendStatus(status: unknown): DeforestationUiState {
  const normalized = normalizeBackendPlotStatus(status);
  if (normalized === 'deforestation_clear') return 'passed';
  if (normalized === 'under_review') return 'under_review';
  if (normalized === 'degradation_risk') return 'at_risk';
  if (normalized === 'deforestation_detected') return 'alert';
  return 'pending';
}

type BackendPlotComplianceRow = {
  status?: unknown;
  deforestation_screening?: unknown;
};

/**
 * Prefer plot.status; when still pending_check, infer from deforestation_screening snapshot
 * so the field app matches Supabase after screening completes.
 */
export function resolveBackendPlotComplianceStatus(
  row: BackendPlotComplianceRow | null | undefined,
): BackendPlotComplianceStatus {
  if (!row) return 'pending_check';

  const fromStatus = normalizeBackendPlotStatus(row.status);
  if (fromStatus !== 'pending_check') return fromStatus;

  const screening = parseDeforestationScreening(row.deforestation_screening);
  if (!screening?.screenedAt) return fromStatus;

  const tier = String(screening.signalTier ?? '').toLowerCase();
  if (tier === 'green' || tier === 'clear' || tier === 'deforestation_clear') {
    return 'deforestation_clear';
  }
  if (tier === 'amber' || tier === 'degradation_risk') return 'degradation_risk';
  if (tier === 'red' || tier === 'deforestation_detected') return 'deforestation_detected';
  if (tier === 'review' || tier === 'under_review') return 'under_review';

  if (screening.alertCount === 0) return 'deforestation_clear';

  return fromStatus;
}

export function deforestationTitleKey(state: DeforestationUiState): string {
  switch (state) {
    case 'passed':
      return 'plot_deforestation_passed';
    case 'under_review':
      return 'plot_deforestation_under_review';
    case 'at_risk':
      return 'plot_deforestation_at_risk';
    case 'alert':
      return 'plot_deforestation_alert';
    default:
      return 'plot_deforestation_pending';
  }
}

export function deforestationBodyKey(state: DeforestationUiState): string {
  switch (state) {
    case 'passed':
      return 'plot_deforestation_passed_body';
    case 'under_review':
      return 'plot_deforestation_under_review_body';
    case 'at_risk':
      return 'plot_deforestation_at_risk_body';
    case 'alert':
      return 'plot_deforestation_alert_body';
    default:
      return 'plot_deforestation_pending_body';
  }
}

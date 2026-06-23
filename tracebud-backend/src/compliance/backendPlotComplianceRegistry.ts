/**
 * Plot compliance status mirror — keep aligned with src/compliance/plot-compliance-status.ts
 */
export const PLOT_COMPLIANCE_STATUSES = [
  'pending_check',
  'deforestation_clear',
  'under_review',
  'degradation_risk',
  'deforestation_detected',
] as const;

export type PlotComplianceStatusRegistry = (typeof PLOT_COMPLIANCE_STATUSES)[number];

/** Monotonic severity rank (higher = worse). */
export const PLOT_COMPLIANCE_STATUS_RANK: Record<PlotComplianceStatusRegistry, number> = {
  pending_check: 0,
  deforestation_clear: 1,
  under_review: 2,
  degradation_risk: 3,
  deforestation_detected: 4,
};

/** Harvest bundling accepts these legacy + canonical clear statuses. */
export const PLOT_DEFORESTATION_FREE_ALIASES = [
  'verified',
  'deforestation_clear',
  'compliant',
] as const;

/** GFW signal tiers mapped in plot-compliance-status.ts */
export const GFW_SIGNAL_TIERS = ['unknown', 'green', 'amber', 'red'] as const;

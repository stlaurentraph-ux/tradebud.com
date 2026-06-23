/**
 * DDS filing + harvest audit phase mirrors — keep aligned with harvest.service.ts
 */
export const DDS_READINESS_AUDIT_PHASES = [
  'requested',
  'evaluated',
  'blocked',
  'warning',
  'passed',
] as const;

export const DDS_RISK_SCORE_AUDIT_PHASES = [
  'requested',
  'evaluated',
  'low',
  'medium',
  'high',
] as const;

export const DDS_FILING_PREFLIGHT_AUDIT_PHASES = [
  'requested',
  'evaluated',
  'blocked',
  'ready',
] as const;

export const DDS_GENERATION_AUDIT_PHASES = ['requested', 'generated'] as const;

export const DDS_SUBMISSION_AUDIT_PHASES = ['requested', 'accepted', 'replayed'] as const;

export const DDS_FILING_PREFLIGHT_PHASES = ['preflight_blocked', 'preflight_ready'] as const;

export const DDS_READINESS_STATES = ['blocked', 'warning_review', 'ready_to_submit'] as const;

export const DDS_SUBMISSION_STATES = ['submitted'] as const;

export const DDS_PACKAGE_GENERATION_STATES = ['package_generated'] as const;

function expandPrefixed(prefix: string, phases: readonly string[]): string[] {
  return phases.map((phase) => `${prefix}${phase}`);
}

export const DDS_READINESS_AUDIT_EVENT_TYPES = expandPrefixed(
  'dds_package_readiness_',
  DDS_READINESS_AUDIT_PHASES,
);

export const DDS_RISK_SCORE_AUDIT_EVENT_TYPES = expandPrefixed(
  'dds_package_risk_score_',
  DDS_RISK_SCORE_AUDIT_PHASES,
);

export const DDS_FILING_PREFLIGHT_AUDIT_EVENT_TYPES = expandPrefixed(
  'dds_package_filing_preflight_',
  DDS_FILING_PREFLIGHT_AUDIT_PHASES,
);

export const DDS_GENERATION_AUDIT_EVENT_TYPES = expandPrefixed(
  'dds_package_generation_',
  DDS_GENERATION_AUDIT_PHASES,
);

export const DDS_SUBMISSION_AUDIT_EVENT_TYPES = expandPrefixed(
  'dds_package_submission_',
  DDS_SUBMISSION_AUDIT_PHASES,
);

export const DDS_FILING_AUDIT_EVENT_TYPES = [
  ...DDS_READINESS_AUDIT_EVENT_TYPES,
  ...DDS_RISK_SCORE_AUDIT_EVENT_TYPES,
  ...DDS_FILING_PREFLIGHT_AUDIT_EVENT_TYPES,
  ...DDS_GENERATION_AUDIT_EVENT_TYPES,
  ...DDS_SUBMISSION_AUDIT_EVENT_TYPES,
] as const;

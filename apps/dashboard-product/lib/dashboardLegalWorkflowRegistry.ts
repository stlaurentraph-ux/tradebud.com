/**
 * Legal workflow + DDS state mirrors — keep aligned with types/index.ts and lib/rbac.ts
 * Guard: dashboard-legal-workflow-guard.mjs
 */
export const DASHBOARD_LEGAL_WORKFLOW_ROLES = [
  'OUT_OF_SCOPE',
  'OPERATOR',
  'MICRO_SMALL_PRIMARY_OPERATOR',
  'DOWNSTREAM_OPERATOR_FIRST',
  'DOWNSTREAM_OPERATOR_SUBSEQUENT',
  'TRADER',
  'PENDING_MANUAL_CLASSIFICATION',
] as const;

export const DASHBOARD_WORKFLOW_TYPES = [
  'OUT_OF_SCOPE_WORKFLOW',
  'DDS_WORKFLOW',
  'SIMPLIFIED_DECLARATION_WORKFLOW',
  'DOWNSTREAM_REFERENCE_WORKFLOW',
  'TRADER_RETENTION_WORKFLOW',
  'MANUAL_HOLD_WORKFLOW',
] as const;

export const DASHBOARD_DDS_STATUSES = [
  'DRAFT',
  'READY_TO_SUBMIT',
  'SUBMITTED',
  'ACCEPTED',
  'REJECTED',
  'PENDING_CONFIRMATION',
  'AMENDMENT_DRAFT',
  'AMENDED_SUBMITTED',
  'WITHDRAWAL_REQUESTED',
  'WITHDRAWN',
  'SUPERSEDED',
] as const;

export const DASHBOARD_PACKAGE_COMPLIANCE_STATUSES = [
  'PENDING',
  'PASSED',
  'WARNINGS',
  'BLOCKED',
] as const;

/** Legal roles that block workflow progression (canProceedWithWorkflow). */
export const DASHBOARD_LEGAL_WORKFLOW_BLOCKED_ROLES = [
  'PENDING_MANUAL_CLASSIFICATION',
  'OUT_OF_SCOPE',
] as const;

/** Maps legal role → workflow type in getWorkflowTypeForRole(). */
export const DASHBOARD_LEGAL_ROLE_TO_WORKFLOW: Record<
  (typeof DASHBOARD_LEGAL_WORKFLOW_ROLES)[number],
  (typeof DASHBOARD_WORKFLOW_TYPES)[number]
> = {
  OUT_OF_SCOPE: 'OUT_OF_SCOPE_WORKFLOW',
  OPERATOR: 'DDS_WORKFLOW',
  MICRO_SMALL_PRIMARY_OPERATOR: 'SIMPLIFIED_DECLARATION_WORKFLOW',
  DOWNSTREAM_OPERATOR_FIRST: 'DOWNSTREAM_REFERENCE_WORKFLOW',
  DOWNSTREAM_OPERATOR_SUBSEQUENT: 'DOWNSTREAM_REFERENCE_WORKFLOW',
  TRADER: 'TRADER_RETENTION_WORKFLOW',
  PENDING_MANUAL_CLASSIFICATION: 'MANUAL_HOLD_WORKFLOW',
};

/**
 * Dashboard TenantRole values that map to backend JWT workspace AppRole claims.
 * Dashboard-only roles (importer, sponsor) are UI personas without a 1:1 backend AppRole.
 */
export const DASHBOARD_BACKEND_ALIGNED_TENANT_ROLES = [
  'exporter',
  'cooperative',
  'country_reviewer',
] as const;

export const DASHBOARD_ONLY_TENANT_ROLES = ['importer', 'sponsor'] as const;

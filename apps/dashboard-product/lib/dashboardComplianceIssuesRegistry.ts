/**
 * Operational compliance issues workflow — /compliance/issues aggregated view.
 * Guard: dashboard-compliance-issues-guard.mjs, dashboard-compliance-permission-guard.mjs
 */
export const DASHBOARD_OPERATIONAL_ISSUE_SEVERITIES = ['INFO', 'WARNING', 'BLOCKING'] as const;

export const DASHBOARD_OPERATIONAL_ISSUE_STATUSES = [
  'open',
  'in_progress',
  'resolved',
  'closed',
] as const;

export const DASHBOARD_OPERATIONAL_ISSUE_KINDS = [
  'canonical',
  'campaign',
  'request',
  'upstream_blocker',
] as const;

export const DASHBOARD_OPERATIONAL_ISSUE_OWNER_ROLES = [
  'cooperative',
  'exporter',
  'importer',
  'farmer',
  'system',
] as const;

export const DASHBOARD_OPERATIONAL_LINKED_ENTITY_TYPES = [
  'plot',
  'batch',
  'package',
  'farmer',
  'campaign',
  'request',
  'tenure_verification',
] as const;

export type DashboardOperationalIssueSeverity =
  (typeof DASHBOARD_OPERATIONAL_ISSUE_SEVERITIES)[number];
export type DashboardOperationalIssueStatus =
  (typeof DASHBOARD_OPERATIONAL_ISSUE_STATUSES)[number];
export type DashboardOperationalIssueKind = (typeof DASHBOARD_OPERATIONAL_ISSUE_KINDS)[number];

/** Kanban + PATCH transitions for owned compliance_issues rows. */
export const DASHBOARD_ISSUE_STATUS_TRANSITIONS: Record<
  DashboardOperationalIssueStatus,
  readonly DashboardOperationalIssueStatus[]
> = {
  open: ['in_progress', 'resolved', 'closed'],
  in_progress: ['resolved', 'closed', 'open'],
  resolved: ['closed', 'open'],
  closed: ['open'],
};

export const DASHBOARD_ISSUE_KANBAN_COLUMNS = [
  { key: 'open', statuses: ['open'] as const },
  { key: 'in_progress', statuses: ['in_progress'] as const },
  { key: 'resolved', statuses: ['resolved', 'closed'] as const },
] as const;

export function canTransitionIssueStatus(
  from: string,
  to: string,
): boolean {
  const allowed = DASHBOARD_ISSUE_STATUS_TRANSITIONS[from as DashboardOperationalIssueStatus];
  return Boolean(allowed?.includes(to as DashboardOperationalIssueStatus));
}

export function getKanbanAdvanceStatus(
  current: string,
): DashboardOperationalIssueStatus | null {
  if (current === 'open') return 'in_progress';
  if (current === 'in_progress') return 'resolved';
  return null;
}

/** Prefix for rows persisted in compliance_issues (PATCH allowed when can_update_status). */
export const DASHBOARD_PERSISTED_ISSUE_ID_PREFIX = 'issue_compliance_' as const;

export function canPersistOperationalIssueStatus(
  issueId: string,
  canUpdateStatus?: boolean,
): boolean {
  return Boolean(canUpdateStatus && issueId.startsWith(DASHBOARD_PERSISTED_ISSUE_ID_PREFIX));
}

/** Nav routes + PermissionGate contracts for compliance issues surfaces. */
export const DASHBOARD_COMPLIANCE_PAGE_CONTRACTS = [
  {
    id: 'compliance-issues',
    route: '/compliance/issues',
    navPermission: 'compliance:view',
    pagePath: 'app/compliance/issues/page.tsx',
    actionPermissions: ['compliance:create_issue', 'compliance:resolve_issue'],
  },
  {
    id: 'compliance-issues-kanban-advance',
    route: '/compliance/issues',
    navPermission: 'compliance:view',
    pagePath: 'components/compliance/compliance-issues-kanban.tsx',
    actionPermissions: ['compliance:resolve_issue'],
  },
] as const;

/**
 * Dashboard tenant roles that must reach backend operational issues APIs when granted permissions.
 * Guard: dashboard-compliance-backend-parity-guard.mjs
 */
export const DASHBOARD_BACKEND_ISSUES_API_BINDINGS = [
  {
    backendId: 'requests_operational_issues',
    permission: 'compliance:view',
    tenantRoles: ['exporter', 'cooperative', 'importer', 'sponsor', 'country_reviewer'],
  },
  {
    backendId: 'requests_operational_issues',
    permission: 'compliance:resolve_issue',
    tenantRoles: ['exporter', 'cooperative', 'sponsor'],
  },
  {
    backendId: 'requests_operational_issues',
    permission: 'compliance:create_issue',
    tenantRoles: ['exporter', 'cooperative', 'sponsor'],
  },
] as const;

/** Maps dashboard TenantRole to JWT AppRole used by backend operational issues APIs. */
export const DASHBOARD_ISSUES_TENANT_BACKEND_JWT_ROLE = {
  exporter: 'exporter',
  cooperative: 'cooperative',
  importer: 'importer',
  country_reviewer: 'country_reviewer',
  sponsor: 'compliance_manager',
} as const;

/**
 * Dashboard client analytics events for operational issues lifecycle.
 * Guard: dashboard-audit-parity-guard.mjs (extend when backend emits matching audit types).
 */
export const DASHBOARD_ISSUES_ANALYTICS_EVENT_PARITY = [
  {
    dashboardEvent: 'dashboard_issue_status_changed',
    note: 'Client analytics; backend PATCH does not emit audit yet',
  },
  {
    dashboardEvent: 'dashboard_issue_create_success',
    note: 'Local create dialog until POST /v1/compliance-issues exists',
  },
] as const;

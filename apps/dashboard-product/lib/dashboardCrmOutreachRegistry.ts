/**
 * CRM + outreach workflow mirrors — contacts, farmers, campaigns, inbox.
 * Guard: dashboard-crm-guard.mjs, dashboard-campaign-guard.mjs, dashboard-network-permission-guard.mjs
 */
import type { RequestCampaignStatus } from '@/types';

export const DASHBOARD_CONTACT_STATUSES = [
  'new',
  'invited',
  'engaged',
  'submitted',
  'inactive',
  'blocked',
] as const;

export const DASHBOARD_CONTACT_CONSENT_STATUSES = ['unknown', 'granted', 'revoked'] as const;

/** Producers on /farmers are CRM contacts with this activity type. */
export const DASHBOARD_FARMER_CONTACT_TYPE = 'farmer' as const;

export const DASHBOARD_REQUEST_CAMPAIGN_STATUSES = [
  'DRAFT',
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'PARTIAL',
  'EXPIRED',
  'CANCELLED',
] as const;

export const DASHBOARD_INBOX_REQUEST_STATUSES = ['PENDING', 'RESPONDED'] as const;

export const DASHBOARD_REQUEST_TYPES = [
  'MISSING_PRODUCER_PROFILE',
  'MISSING_PLOT_GEOMETRY',
  'MISSING_LAND_TITLE',
  'MISSING_HARVEST_RECORD',
  'YIELD_EVIDENCE',
  'CONSENT_GRANT',
  'DDS_REFERENCE',
  'GENERAL_EVIDENCE',
  'OTHER',
] as const;

export const DASHBOARD_OUTREACH_UI_STATUSES = [
  'Draft',
  'Sent',
  'Completed',
  'Archived',
] as const;

export const DASHBOARD_INBOX_UI_STATUSES = ['Pending', 'Fulfilled'] as const;

export type DashboardContactStatus = (typeof DASHBOARD_CONTACT_STATUSES)[number];
export type DashboardContactConsentStatus = (typeof DASHBOARD_CONTACT_CONSENT_STATUSES)[number];
export type DashboardOutreachUiStatus = (typeof DASHBOARD_OUTREACH_UI_STATUSES)[number];
export type DashboardInboxUiStatus = (typeof DASHBOARD_INBOX_UI_STATUSES)[number];
export type DashboardRequestType = (typeof DASHBOARD_REQUEST_TYPES)[number];

/** Backend-aligned campaign lifecycle (requests.service.ts). */
export const DASHBOARD_CAMPAIGN_STATUS_TRANSITIONS: Record<
  RequestCampaignStatus,
  readonly RequestCampaignStatus[]
> = {
  DRAFT: ['QUEUED', 'RUNNING', 'CANCELLED'],
  QUEUED: ['RUNNING', 'CANCELLED'],
  RUNNING: ['COMPLETED', 'PARTIAL', 'EXPIRED', 'CANCELLED'],
  PARTIAL: ['COMPLETED', 'EXPIRED', 'CANCELLED'],
  COMPLETED: [],
  EXPIRED: [],
  CANCELLED: [],
};

/** Collapses backend campaign status into outreach UI tabs. */
export const DASHBOARD_CAMPAIGN_TO_OUTREACH_UI: Record<
  (typeof DASHBOARD_REQUEST_CAMPAIGN_STATUSES)[number],
  DashboardOutreachUiStatus
> = {
  DRAFT: 'Draft',
  QUEUED: 'Sent',
  RUNNING: 'Sent',
  COMPLETED: 'Completed',
  PARTIAL: 'Completed',
  EXPIRED: 'Archived',
  CANCELLED: 'Archived',
};

export const DASHBOARD_INBOX_TO_UI: Record<
  (typeof DASHBOARD_INBOX_REQUEST_STATUSES)[number],
  DashboardInboxUiStatus
> = {
  PENDING: 'Pending',
  RESPONDED: 'Fulfilled',
};

export function mapCampaignStatusToOutreachUi(status: string): DashboardOutreachUiStatus {
  const mapped = DASHBOARD_CAMPAIGN_TO_OUTREACH_UI[status as RequestCampaignStatus];
  return mapped ?? 'Archived';
}

export function mapInboxStatusToUi(status: string): DashboardInboxUiStatus {
  if (status === 'PENDING') return 'Pending';
  return 'Fulfilled';
}

export function canSendDraftCampaign(status: string): boolean {
  return status === 'DRAFT';
}

/** Backend archive sets status to CANCELLED (shown under Archived tab). */
export function canArchiveCampaign(status: string): boolean {
  return status !== 'CANCELLED';
}

/** Nav routes + page-level PermissionGate contracts for network/outreach surfaces. */
export const DASHBOARD_NETWORK_PAGE_CONTRACTS = [
  {
    id: 'contacts',
    route: '/contacts',
    navPermission: 'contacts:view',
    pagePath: 'app/contacts/page.tsx',
    actionPermissions: ['contacts:create', 'contacts:edit'],
  },
  {
    id: 'farmers',
    route: '/farmers',
    navPermission: 'farmers:view',
    pagePath: 'app/farmers/page.tsx',
    actionPermissions: ['farmers:create'],
  },
  {
    id: 'outreach',
    route: '/outreach',
    navPermission: 'outreach:view',
    pagePath: 'app/outreach/page.tsx',
    actionPermissions: ['requests:create', 'requests:send', 'requests:archive'],
  },
  {
    id: 'inbox',
    route: '/inbox',
    navPermission: 'inbox:view',
    pagePath: 'app/inbox/page.tsx',
    actionPermissions: ['requests:respond'],
  },
  {
    id: 'programmes',
    route: '/programmes',
    navPermission: 'outreach:view',
    pagePath: 'app/programmes/page.tsx',
    actionPermissions: ['requests:create', 'requests:send', 'requests:archive'],
  },
  {
    id: 'outreach-wizard-send',
    route: '/outreach',
    navPermission: 'outreach:view',
    pagePath: 'components/requests/wizard/step-review-send.tsx',
    actionPermissions: ['requests:send'],
  },
] as const;

/**
 * Dashboard client analytics events that mirror backend audit log types.
 * Guard: dashboard-audit-parity-guard.mjs
 */
export const DASHBOARD_BACKEND_AUDIT_EVENT_PARITY = [
  {
    backendEvent: 'contact_status_changed',
    dashboardEvent: 'dashboard_contact_status_changed',
  },
  {
    backendEvent: 'contact_created_or_updated',
    dashboardEvent: 'dashboard_contact_create_success',
  },
] as const;

/** Maps dashboard TenantRole to JWT AppRole used by backend network APIs. */
export const DASHBOARD_TENANT_BACKEND_JWT_ROLE = {
  exporter: 'exporter',
  cooperative: 'cooperative',
  importer: 'importer',
  country_reviewer: 'country_reviewer',
  sponsor: 'compliance_manager',
} as const;

/**
 * Dashboard tenant roles that must be able to reach backend network APIs when granted permissions.
 * Guard: dashboard-backend-network-parity-guard.mjs
 */
export const DASHBOARD_BACKEND_NETWORK_API_BINDINGS = [
  {
    backendId: 'contacts_crm',
    permission: 'contacts:view',
    tenantRoles: ['exporter', 'cooperative', 'importer', 'sponsor', 'country_reviewer'],
  },
  {
    backendId: 'contacts_crm',
    permission: 'contacts:create',
    tenantRoles: ['exporter', 'cooperative', 'importer', 'sponsor', 'country_reviewer'],
  },
  {
    backendId: 'requests_campaigns',
    permission: 'requests:create',
    tenantRoles: ['exporter', 'cooperative', 'importer', 'sponsor', 'country_reviewer'],
  },
  {
    backendId: 'requests_campaigns',
    permission: 'requests:send',
    tenantRoles: ['exporter', 'cooperative', 'importer', 'sponsor', 'country_reviewer'],
  },
  {
    backendId: 'requests_campaigns',
    permission: 'requests:archive',
    tenantRoles: ['exporter', 'cooperative', 'importer', 'sponsor', 'country_reviewer'],
  },
  {
    backendId: 'inbox_requests',
    permission: 'inbox:view',
    tenantRoles: ['exporter', 'cooperative', 'importer', 'sponsor', 'country_reviewer'],
  },
  {
    backendId: 'inbox_requests',
    permission: 'requests:respond',
    tenantRoles: ['importer', 'sponsor', 'country_reviewer'],
  },
] as const;

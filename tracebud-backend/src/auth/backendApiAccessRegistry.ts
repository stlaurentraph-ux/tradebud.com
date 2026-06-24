/**
 * Backend API role access mirror — keep aligned with controller scope checks.
 * Guard: backend-api-access-guard.mjs
 */

export type BackendApiAccessEntry = {
  readonly id: string;
  readonly file: string;
  readonly roles: readonly string[];
  readonly note?: string;
};

export const BACKEND_API_ACCESS_ENTRIES: readonly BackendApiAccessEntry[] = [
  {
    id: 'harvest_dds_workspace',
    file: 'harvest/harvest.controller.ts',
    roles: ['exporter', 'cooperative', 'admin', 'compliance_manager'],
  },
  {
    id: 'requests_campaigns',
    file: 'requests/requests.controller.ts',
    roles: ['admin', 'exporter', 'compliance_manager', 'cooperative', 'importer', 'country_reviewer'],
  },
  {
    id: 'requests_operational_issues',
    file: 'requests/requests.controller.ts',
    roles: ['admin', 'exporter', 'compliance_manager', 'cooperative', 'importer', 'country_reviewer', 'sponsor'],
  },
  {
    id: 'requests_evidence',
    file: 'requests/requests.controller.ts',
    roles: ['admin', 'exporter', 'compliance_manager', 'cooperative'],
  },
  {
    id: 'contacts_crm',
    file: 'contacts/contacts.controller.ts',
    roles: ['admin', 'exporter', 'importer', 'cooperative', 'compliance_manager', 'country_reviewer'],
  },
  {
    id: 'inbox_requests',
    file: 'inbox/inbox.controller.ts',
    roles: ['exporter', 'admin', 'compliance_manager', 'agent', 'cooperative', 'importer', 'country_reviewer'],
  },
  {
    id: 'billing_subscription_band',
    file: 'billing/billing.controller.ts',
    roles: ['admin', 'compliance_manager'],
  },
  {
    id: 'reports_importer_summary',
    file: 'reports/reports.controller.ts',
    roles: ['compliance_manager', 'admin', 'exporter'],
  },
  {
    id: 'yield_benchmarks_admin',
    file: 'integrations/yield-benchmarks.controller.ts',
    roles: ['admin', 'compliance_manager'],
  },
  {
    id: 'partner_export_start',
    file: 'integrations/partner-data.controller.ts',
    roles: ['exporter'],
    note: 'start export',
  },
  {
    id: 'partner_export_status',
    file: 'integrations/partner-data.controller.ts',
    roles: ['exporter', 'agent'],
    note: 'view/download export',
  },
  {
    id: 'eudr_connectivity',
    file: 'integrations/eudr.controller.ts',
    roles: ['exporter', 'agent'],
  },
  {
    id: 'field_plot_sync',
    file: 'plots/plots.controller.ts',
    roles: ['farmer', 'agent'],
    note: 'enforceSyncPlotScope via resolveFieldActorRole',
  },
  {
    id: 'plots_approve_geometry',
    file: 'plots/plots.controller.ts',
    roles: ['exporter', 'compliance_manager', 'country_reviewer', 'admin'],
    note: 'POST approve-geometry',
  },
  {
    id: 'cadastral_parcel_lookup',
    file: 'plots/cadastral-parcel.controller.ts',
    roles: ['exporter', 'cooperative', 'compliance_manager', 'country_reviewer', 'admin', 'agent'],
    note: 'GET lookup demo fixtures',
  },
] as const;

/** Billing meter event types (billing_meter table — not audit_log). */
export const BILLING_METER_EVENT_TYPES = [
  'SHIPMENT_FEE_ORIGIN_SEAL',
  'SHIPMENT_FEE_DESTINATION_SUBMIT',
] as const;

/** integration_audit_v2 event types (separate table). */
export const INTEGRATION_V2_AUDIT_EVENT_TYPES = [
  'integration_v2_stale_sweeper_executed',
] as const;

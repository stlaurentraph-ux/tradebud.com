/**
 * Code mirror of product-os/04-quality/dashboard-rbac-registry.md
 * Guard: dashboard-rbac-guard.mjs
 */
export const DASHBOARD_TENANT_ROLES = [
  'exporter',
  'importer',
  'cooperative',
  'country_reviewer',
  'sponsor',
] as const;

export type DashboardTenantRole = (typeof DASHBOARD_TENANT_ROLES)[number];

export const DASHBOARD_SHIPMENT_STATUSES = [
  'DRAFT',
  'READY',
  'SEALED',
  'SUBMITTED',
  'ACCEPTED',
  'REJECTED',
  'ARCHIVED',
  'ON_HOLD',
] as const;

export type DashboardShipmentStatus = (typeof DASHBOARD_SHIPMENT_STATUSES)[number];

/**
 * Backend AppRole mirror — keep aligned with tracebud-backend/src/auth/roles.ts
 * and apps/offline-product/features/auth/fieldRolePermissionRegistry.ts (field subset).
 */
export const BACKEND_APP_ROLES = [
  'farmer',
  'agent',
  'exporter',
  'cooperative',
  'admin',
  'compliance_manager',
  'country_reviewer',
] as const;

export type BackendAppRole = (typeof BACKEND_APP_ROLES)[number];

export const FIELD_APP_ROLES = ['farmer', 'agent'] as const satisfies readonly BackendAppRole[];

export const DASHBOARD_WORKSPACE_ROLES = [
  'exporter',
  'cooperative',
  'admin',
  'compliance_manager',
  'country_reviewer',
] as const satisfies readonly BackendAppRole[];

/**
 * Field app roles and permissions (MVP).
 * Code mirror: product-os/04-quality/field-role-permission-registry.md
 * Backend mirror: tracebud-backend/src/auth/roles.ts (farmer, agent)
 */

export const FIELD_APP_ROLES = ['farmer', 'agent'] as const;
export type FieldAppRole = (typeof FIELD_APP_ROLES)[number];

export const FIELD_APP_PERMISSIONS = [
  'plot:map',
  'plot:edit',
  'plot:sync',
  'harvest:log',
  'evidence:upload',
  'declaration:submit',
  'sync:manual',
  'settings:profile',
  'consent:respond',
] as const;

export type FieldAppPermission = (typeof FIELD_APP_PERMISSIONS)[number];

/** MVP: farmer and agent share field capture permissions; dashboard roles are blocked at sign-in. */
export const FIELD_ROLE_PERMISSIONS: Record<FieldAppRole, readonly FieldAppPermission[]> = {
  farmer: FIELD_APP_PERMISSIONS,
  agent: FIELD_APP_PERMISSIONS,
};

export const DASHBOARD_ROLES_BLOCKED_FROM_FIELD_APP = [
  'exporter',
  'cooperative',
  'admin',
  'compliance_manager',
  'country_reviewer',
] as const;

export function fieldRoleHasPermission(
  role: FieldAppRole,
  permission: FieldAppPermission,
): boolean {
  return FIELD_ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

import {
  DASHBOARD_ROLES_BLOCKED_FROM_FIELD_APP,
  fieldRoleHasPermission,
  type FieldAppPermission,
  type FieldAppRole,
} from '@/features/auth/fieldRolePermissionRegistry';
import { getSyncAuthUser, parseFieldAppRole } from '@/features/auth/fieldAppSessionRole';

export type FieldPermissionDenyReason =
  | 'not_signed_in'
  | 'blocked_role'
  | 'missing_permission'
  | 'unknown_role';

export class FieldPermissionDeniedError extends Error {
  readonly permission: FieldAppPermission;
  readonly reason: FieldPermissionDenyReason;
  readonly role: string | null;

  constructor(params: {
    permission: FieldAppPermission;
    reason: FieldPermissionDenyReason;
    role?: string | null;
  }) {
    super(fieldPermissionDeniedMessage(params));
    this.name = 'FieldPermissionDeniedError';
    this.permission = params.permission;
    this.reason = params.reason;
    this.role = params.role ?? null;
  }
}

export function fieldPermissionDeniedMessage(params: {
  permission: FieldAppPermission;
  reason: FieldPermissionDenyReason;
  role?: string | null;
}): string {
  switch (params.reason) {
    case 'not_signed_in':
      return 'Sign in to use this feature.';
    case 'blocked_role':
      return 'This account cannot use the field app.';
    case 'missing_permission':
    case 'unknown_role':
    default:
      return 'You do not have permission for this action.';
  }
}

export type FieldPermissionCheckResult =
  | { allowed: true; role: FieldAppRole }
  | { allowed: false; reason: FieldPermissionDenyReason; role: string | null };

function isBlockedDashboardRole(role: string): boolean {
  return (DASHBOARD_ROLES_BLOCKED_FROM_FIELD_APP as readonly string[]).includes(role);
}

export function checkFieldAppPermissionForRole(
  roleRaw: string | null | undefined,
  permission: FieldAppPermission,
): FieldPermissionCheckResult {
  const role = typeof roleRaw === 'string' ? roleRaw.trim().toLowerCase() : '';
  if (!role) {
    return { allowed: false, reason: 'unknown_role', role: null };
  }
  if (isBlockedDashboardRole(role)) {
    return { allowed: false, reason: 'blocked_role', role };
  }
  const fieldRole = parseFieldAppRole(role);
  if (!fieldRole) {
    return { allowed: false, reason: 'unknown_role', role };
  }
  if (!fieldRoleHasPermission(fieldRole, permission)) {
    return { allowed: false, reason: 'missing_permission', role: fieldRole };
  }
  return { allowed: true, role: fieldRole };
}

export async function checkFieldAppPermission(
  permission: FieldAppPermission,
): Promise<FieldPermissionCheckResult> {
  const user = await getSyncAuthUser();
  if (!user) {
    return { allowed: false, reason: 'not_signed_in', role: null };
  }
  const rawRole =
    typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : null;
  return checkFieldAppPermissionForRole(rawRole, permission);
}

export async function assertFieldAppPermission(
  permission: FieldAppPermission,
): Promise<FieldAppRole> {
  const result = await checkFieldAppPermission(permission);
  if (!result.allowed) {
    throw new FieldPermissionDeniedError({
      permission,
      reason: result.reason,
      role: result.role,
    });
  }
  return result.role;
}

import { getSyncAuthUser as getSyncAuthUserFromSession } from '@/features/api/syncAuthSession';
import {
  FIELD_APP_ROLES,
  type FieldAppRole,
} from '@/features/auth/fieldRolePermissionRegistry';

export { getSyncAuthUserFromSession as getSyncAuthUser };

export function parseFieldAppRole(raw: unknown): FieldAppRole | null {
  if (typeof raw !== 'string') return null;
  const role = raw.trim().toLowerCase();
  if ((FIELD_APP_ROLES as readonly string[]).includes(role)) {
    return role as FieldAppRole;
  }
  return null;
}

export async function resolveFieldAppSessionRole(): Promise<FieldAppRole | null> {
  const user = await getSyncAuthUserFromSession();
  if (!user) return null;
  return parseFieldAppRole(user.app_metadata?.role);
}

export function isFieldAgentRole(role: FieldAppRole | null | undefined): boolean {
  return role === 'agent';
}

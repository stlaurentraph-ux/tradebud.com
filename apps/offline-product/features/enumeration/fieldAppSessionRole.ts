import { getSyncAuthUser } from '@/features/api/syncAuthSession';
import type { FieldAppRole } from '@/features/auth/fieldRolePermissionRegistry';

export function parseFieldAppRole(raw: unknown): FieldAppRole | null {
  if (typeof raw !== 'string') return null;
  const role = raw.trim().toLowerCase();
  if (role === 'farmer' || role === 'agent') return role;
  return null;
}

export async function resolveFieldAppSessionRole(): Promise<FieldAppRole | null> {
  const user = await getSyncAuthUser();
  if (!user) return null;
  return parseFieldAppRole(user.app_metadata?.role);
}

export function isFieldAgentRole(role: FieldAppRole | null | undefined): boolean {
  return role === 'agent';
}

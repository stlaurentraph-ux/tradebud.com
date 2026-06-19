import type { Session } from '@supabase/supabase-js';

/** Primary JWT app role from Supabase (dashboard workspace or field). */
export function getAppRoleFromSession(session: Session): string | null {
  const raw = session.user.app_metadata?.role;
  if (typeof raw !== 'string') return null;
  const role = raw.trim().toLowerCase();
  return role.length > 0 ? role : null;
}

export function isDashboardWorkspaceRole(role: string | null): boolean {
  if (!role) return false;
  return role !== 'farmer' && role !== 'agent';
}

export function isDashboardWorkspaceSession(session: Session): boolean {
  return isDashboardWorkspaceRole(getAppRoleFromSession(session));
}

/** Dashboard users need field-app bootstrap to link local farmer id before sync APIs work. */
export function shouldBootstrapFieldAppProfile(session: Session): boolean {
  return isDashboardWorkspaceRole(getAppRoleFromSession(session));
}

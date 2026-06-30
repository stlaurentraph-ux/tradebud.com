import type { Session } from '@supabase/supabase-js';

/** Primary JWT app role from Supabase (dashboard workspace or field). */
export function getAppRoleFromSession(session: Session): string | null {
  const raw = session.user.app_metadata?.role;
  if (typeof raw !== 'string') return null;
  const role = raw.trim().toLowerCase();
  return role.length > 0 ? role : null;
}

/** Mirror backend parseClaimRole: app_metadata.role, then user_metadata.role. */
export function parseClaimRoleFromAuthUser(
  user:
    | {
        app_metadata?: Record<string, unknown>;
        user_metadata?: Record<string, unknown>;
      }
    | null
    | undefined,
): string | null {
  const appRole = user?.app_metadata?.role;
  if (typeof appRole === 'string' && appRole.trim()) {
    return appRole.trim().toLowerCase();
  }
  const userRole = user?.user_metadata?.role;
  if (typeof userRole === 'string' && userRole.trim()) {
    return userRole.trim().toLowerCase();
  }
  return null;
}

/** Mirror backend isFieldAppSignupUser — native field signups and linked dashboard accounts. */
export function isFieldAppSignupUser(
  user:
    | {
        app_metadata?: Record<string, unknown>;
        user_metadata?: Record<string, unknown>;
      }
    | null
    | undefined,
): boolean {
  const signupSource = user?.app_metadata?.signup_source ?? user?.user_metadata?.signup_source;
  if (signupSource === 'field-app') {
    return true;
  }
  const linked = user?.user_metadata?.field_app_linked ?? user?.app_metadata?.field_app_linked;
  return linked === true || linked === 'true';
}

export function isDashboardWorkspaceRole(role: string | null): boolean {
  if (!role) return false;
  return role !== 'farmer' && role !== 'agent';
}

export function isDashboardWorkspaceSession(session: Session): boolean {
  return isDashboardWorkspaceRole(getAppRoleFromSession(session));
}

/** Dashboard workspace emails must not sign into the field app (use dashboard.tracebud.com). */
export function isDashboardWorkspaceEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return /\+demo@tracebud\.com$/i.test(normalized) || normalized === 'exporter+demo@tracebud.com';
}

/** Block OAuth sign-in when a dashboard account is linked to a different Google/Apple identity. */
export function fieldAppBlocksDashboardOAuthSignIn(session: Session): boolean {
  if (!isDashboardWorkspaceSession(session)) {
    const primary = session.user.email?.trim().toLowerCase() ?? '';
    if (isDashboardWorkspaceEmail(primary)) {
      return true;
    }
    return false;
  }

  if (session.user.user_metadata?.field_app_linked === true) {
    return false;
  }

  const primary = session.user.email?.trim().toLowerCase() ?? '';
  for (const identity of session.user.identities ?? []) {
    if (identity.provider !== 'google' && identity.provider !== 'apple') continue;
    const identityEmail = String(identity.identity_data?.email ?? '').trim().toLowerCase();
    if (identityEmail && primary && identityEmail !== primary) {
      return true;
    }
  }

  return true;
}

/** Dashboard users need field-app bootstrap to link local farmer id before sync APIs work. */
export function shouldBootstrapFieldAppProfile(session: Session): boolean {
  return isDashboardWorkspaceRole(getAppRoleFromSession(session));
}

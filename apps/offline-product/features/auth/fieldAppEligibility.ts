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

/** Sandbox dashboard demo identities must not use the field app as a farmer profile. */
export function isDashboardWorkspaceEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return /\+demo@tracebud\.com$/i.test(normalized) || normalized === 'exporter+demo@tracebud.com';
}

/** OAuth provider identity email differs from the Supabase account primary email. */
export function hasOAuthIdentityEmailMismatch(session: Session): boolean {
  const primary = session.user.email?.trim().toLowerCase() ?? '';
  if (!primary) return false;

  for (const identity of session.user.identities ?? []) {
    if (identity.provider !== 'google' && identity.provider !== 'apple') continue;
    const identityEmail = String(identity.identity_data?.email ?? '').trim().toLowerCase();
    if (identityEmail && identityEmail !== primary) {
      return true;
    }
  }

  return false;
}

/**
 * Block field-app OAuth when the identity is unsafe for field capture.
 * Dashboard workspace users (cooperative, exporter, etc.) may also use the field app;
 * first sign-in sets `field_app_linked` via ensureFarmerOAuthProfile.
 */
export function fieldAppBlocksDashboardOAuthSignIn(session: Session): boolean {
  if (isDashboardWorkspaceEmail(session.user.email ?? '')) {
    return true;
  }
  if (hasOAuthIdentityEmailMismatch(session)) {
    return true;
  }
  if (!isDashboardWorkspaceSession(session)) {
    return false;
  }
  return false;
}

export function shouldBootstrapFieldAppProfile(session: Session): boolean {
  return isDashboardWorkspaceRole(getAppRoleFromSession(session));
}

import type { Session } from '@supabase/supabase-js';

import {
  getAuthenticatedSupabaseClient,
  getSupabaseAuthClient,
} from '@/features/api/syncAuthSession';
import { getAppRoleFromSession, isDashboardWorkspaceRole } from '@/features/auth/fieldAppEligibility';

const PROFILE_UPDATE_TIMEOUT_MS = 5_000;

export function getNameFromSession(session: Session): string {
  const meta = session.user.user_metadata?.full_name;
  if (typeof meta === 'string' && meta.trim()) {
    return meta.trim();
  }

  for (const identity of session.user.identities ?? []) {
    const data = identity.identity_data;
    const fullName = data?.full_name ?? data?.name;
    if (typeof fullName === 'string' && fullName.trim()) {
      return fullName.trim();
    }
    const given = data?.given_name;
    const family = data?.family_name;
    if (typeof given === 'string' && given.trim()) {
      return family && typeof family === 'string' && family.trim()
        ? `${given.trim()} ${family.trim()}`
        : given.trim();
    }
  }

  return '';
}

export function getEmailFromSession(session: Session): string {
  const direct = session.user.email?.trim();
  if (direct) return direct;

  for (const identity of session.user.identities ?? []) {
    const email = identity.identity_data?.email;
    if (typeof email === 'string' && email.trim()) {
      return email.trim();
    }
  }

  return '';
}

export async function ensureFarmerOAuthProfile(fullName?: string, session?: Session): Promise<void> {
  const name = fullName?.trim() ?? '';
  const dashboardRole = session ? getAppRoleFromSession(session) : null;
  const linkOnly = isDashboardWorkspaceRole(dashboardRole);
  const payload = {
    data: {
      ...(name ? { full_name: name } : {}),
      signup_source: 'field-app',
      ...(linkOnly ? { field_app_linked: true } : { role: 'farmer' }),
    },
  };

  const client = (await getAuthenticatedSupabaseClient()) ?? getSupabaseAuthClient();
  await Promise.race([
    client.auth.updateUser(payload).then(({ error }) => {
      if (error) throw error;
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('sign_in_oauth_timeout')), PROFILE_UPDATE_TIMEOUT_MS);
    }),
  ]);
}

export function mapOAuthErrorToCode(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'sign_in_oauth_failed';
  }
  if (error.message === 'sign_in_oauth_cancelled') {
    return 'sign_in_oauth_cancelled';
  }
  if (error.message === 'sign_in_oauth_timeout') {
    return 'sign_in_oauth_failed';
  }

  const msg = error.message.toLowerCase();
  if (msg.includes('unsupported provider') || msg.includes('provider is not enabled')) {
    return 'sign_in_oauth_provider_disabled';
  }
  if (msg.includes('nonce')) {
    return 'sign_in_oauth_failed';
  }
  if (msg.includes('sign up not completed') || msg.includes('signup not completed')) {
    return 'sign_in_apple_not_completed';
  }
  if (
    msg.includes('user not found') ||
    msg.includes('invalid login credentials') ||
    msg.includes('not registered') ||
    msg.includes('no user')
  ) {
    return 'sign_in_oauth_needs_signup';
  }

  return 'sign_in_oauth_failed';
}

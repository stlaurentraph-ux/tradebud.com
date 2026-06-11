import type { Session } from '@supabase/supabase-js';

import { getSupabaseAuthClient } from '@/features/api/syncAuthSession';

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

export async function ensureFarmerOAuthProfile(fullName?: string): Promise<void> {
  const name = fullName?.trim() ?? '';
  const supabase = getSupabaseAuthClient();
  await supabase.auth.updateUser({
    data: {
      ...(name ? { full_name: name } : {}),
      role: 'farmer',
      signup_source: 'field-app',
    },
  });
}

export function mapOAuthErrorToCode(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'sign_in_oauth_failed';
  }
  if (error.message === 'sign_in_oauth_cancelled') {
    return 'sign_in_oauth_cancelled';
  }

  const msg = error.message.toLowerCase();
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

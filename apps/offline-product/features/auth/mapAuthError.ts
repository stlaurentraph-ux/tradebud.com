import type { AuthError } from '@supabase/supabase-js';

/** Stable error codes returned to UI (translated via i18n). */
export type SignInErrorCode =
  | 'enter_email_password'
  | 'sign_in_invalid_credentials'
  | 'sign_in_email_not_confirmed'
  | 'sign_up_email_already_exists'
  | 'sign_in_failed'
  | 'sign_in_auth_not_configured'
  | 'sign_in_dashboard_account'
  | 'settings_password_too_short'
  | 'settings_password_mismatch'
  | 'settings_password_weak'
  | 'settings_password_same_as_old'
  | 'settings_password_save_failed'
  | 'settings_password_reauth_required'
  | 'settings_password_network';

export function mapPasswordSignInError(error: AuthError | { message?: string; code?: string }): SignInErrorCode {
  const msg = (error.message ?? '').toLowerCase();
  const code = (error.code ?? '').toLowerCase();

  if (
    msg.includes('invalid login credentials') ||
    code === 'invalid_credentials' ||
    code === 'invalid_grant'
  ) {
    return 'sign_in_invalid_credentials';
  }
  if (msg.includes('email not confirmed') || code === 'email_not_confirmed') {
    return 'sign_in_email_not_confirmed';
  }
  return 'sign_in_failed';
}

export function mapSetPasswordError(
  error: { message?: string; code?: string },
):
  | SignInErrorCode
  | 'settings_password_sign_in_required'
  | 'settings_password_no_email'
  | 'settings_password_save_failed'
  | 'settings_password_reauth_required'
  | 'settings_password_network' {
  const msg = (error.message ?? '').toLowerCase();
  const code = (error.code ?? '').toLowerCase();

  if (
    msg.includes('reauth') ||
    msg.includes('re-authenticate') ||
    msg.includes('recent login') ||
    code === 'insufficient_aal'
  ) {
    return 'settings_password_reauth_required';
  }
  if (msg.includes('at least') && msg.includes('password')) {
    return 'settings_password_too_short';
  }
  if (
    msg.includes('weak') ||
    msg.includes('pwned') ||
    msg.includes('breach') ||
    msg.includes('easy to guess') ||
    code === 'weak_password'
  ) {
    return 'settings_password_weak';
  }
  if (msg.includes('different from the old') || msg.includes('should be different')) {
    return 'settings_password_same_as_old';
  }
  if (
    msg.includes('session') ||
    msg.includes('jwt') ||
    msg.includes('not authenticated') ||
    msg.includes('auth session missing') ||
    code === 'session_not_found'
  ) {
    return 'settings_password_sign_in_required';
  }
  if (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('connection')
  ) {
    return 'settings_password_network';
  }
  return 'settings_password_save_failed';
}

export function mapSignUpError(error: AuthError | { message?: string }): SignInErrorCode | string {
  const msg = (error.message ?? '').toLowerCase();
  if (
    msg.includes('already registered') ||
    msg.includes('already been registered') ||
    msg.includes('user already exists')
  ) {
    return 'sign_up_email_already_exists';
  }
  if (msg.includes('invalid login credentials')) {
    return 'sign_in_invalid_credentials';
  }
  if (msg.includes('email not confirmed')) {
    return 'sign_in_email_not_confirmed';
  }
  return 'sign_in_failed';
}

/** Map raw API / thrown messages to stable codes when possible. */
export function normalizeSignInErrorCode(raw: string): SignInErrorCode | string {
  const trimmed = raw.trim();
  if (/^[a-z][a-z0-9_]+$/.test(trimmed) && !trimmed.includes(' ')) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'sign_in_invalid_credentials';
  }
  if (lower.includes('email not confirmed')) {
    return 'sign_in_email_not_confirmed';
  }
  if (lower.includes('already registered') || lower.includes('user already exists')) {
    return 'sign_up_email_already_exists';
  }
  if (
    lower.includes('sign_in_auth_not_configured') ||
    lower.includes('anon key not configured') ||
    lower.includes('supabase url or anon')
  ) {
    return 'sign_in_auth_not_configured';
  }
  if (lower.includes('supabase login failed') || lower.includes('supabase session')) {
    return 'sign_in_failed';
  }
  return trimmed;
}

export function formatSignInErrorMessage(
  t: (key: string, params?: Record<string, string | number>) => string,
  raw: string,
): string {
  const code = normalizeSignInErrorCode(raw);
  switch (code) {
    case 'enter_email_password':
      return t('enter_email_password');
    case 'sign_in_invalid_credentials':
      return t('sign_in_invalid_credentials');
    case 'sign_in_email_not_confirmed':
      return t('sign_in_email_not_confirmed');
    case 'sign_up_email_already_exists':
      return t('sign_up_email_already_exists');
    case 'sign_in_failed':
      return t('sign_in_failed');
    case 'sign_in_auth_not_configured':
      return t('sign_in_auth_not_configured');
    case 'sign_in_dashboard_account':
      return t('sign_in_dashboard_account');
    case 'settings_password_too_short':
      return t('settings_password_too_short');
    case 'settings_password_mismatch':
      return t('settings_password_mismatch');
    case 'settings_password_weak':
      return t('settings_password_weak');
    case 'settings_password_same_as_old':
      return t('settings_password_same_as_old');
    case 'settings_password_sign_in_required':
      return t('settings_password_sign_in_required');
    case 'settings_password_no_email':
      return t('settings_password_no_email');
    case 'settings_password_save_failed':
      return t('settings_password_save_failed');
    case 'settings_password_reauth_required':
      return t('settings_password_reauth_required');
    case 'settings_password_network':
      return t('settings_password_network');
    case 'sign_in_session_expired':
      return t('sign_in_session_expired');
    default:
      return raw.replace(/\bsupabase\b/gi, 'Tracebud').trim() || t('sign_in_failed');
  }
}

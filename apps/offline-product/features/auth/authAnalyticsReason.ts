/** Stable analytics/Sentry reason codes — never forward raw Supabase/OAuth error text. */
const KNOWN_AUTH_REASONS = new Set([
  'missing_initial_url',
  'exception',
  'session_not_persisted',
  'auth_error_unknown',
  'sign_in_invalid_credentials',
  'sign_in_oauth_cancelled',
  'sign_in_oauth_failed',
  'sign_in_oauth_needs_signup',
  'sign_in_oauth_provider_disabled',
  'sign_in_field_bootstrap_failed',
  'sign_in_api_unreachable',
  'sign_in_dashboard_account',
]);

/**
 * Map auth failure text to a stable reason code for analytics/Sentry.
 * Known i18n keys pass through; everything else becomes `auth_error_unknown`
 * so PII in provider error messages never reaches telemetry.
 */
export function normalizeAuthAnalyticsReason(raw: string | undefined | null): string {
  const trimmed = raw?.trim();
  if (!trimmed) return 'auth_error_unknown';
  if (KNOWN_AUTH_REASONS.has(trimmed)) return trimmed;
  if (/^sign_in_[a-z0-9_]+$/.test(trimmed)) return trimmed;
  return 'auth_error_unknown';
}

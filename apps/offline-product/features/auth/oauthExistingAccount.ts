import type { Session } from '@supabase/supabase-js';

/** Grace window: accounts created before OAuth flow started are treated as pre-existing. */
const SIGNUP_EXISTING_ACCOUNT_GRACE_MS = 5_000;

/**
 * True when OAuth completed during a create-account flow for a user that already existed
 * (created before this signup attempt started).
 */
export function isExistingAuthUserAtSignup(session: Session, signupFlowStartedAtMs: number): boolean {
  const createdAtMs = Date.parse(session.user.created_at ?? '');
  if (!Number.isFinite(createdAtMs)) {
    return false;
  }
  return createdAtMs < signupFlowStartedAtMs - SIGNUP_EXISTING_ACCOUNT_GRACE_MS;
}

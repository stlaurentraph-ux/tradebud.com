import { describe, expect, it } from 'vitest';
import type { Session } from '@supabase/supabase-js';

import { isExistingAuthUserAtSignup } from '@/features/auth/oauthExistingAccount';

function sessionWithCreatedAt(createdAt: string): Session {
  return {
    user: { id: 'user-1', created_at: createdAt },
    access_token: 'access',
    refresh_token: 'refresh',
  } as Session;
}

describe('isExistingAuthUserAtSignup', () => {
  it('treats users created before the signup flow as existing', () => {
    const flowStartedAt = Date.parse('2026-06-23T12:00:00.000Z');
    const session = sessionWithCreatedAt('2026-06-20T08:00:00.000Z');
    expect(isExistingAuthUserAtSignup(session, flowStartedAt)).toBe(true);
  });

  it('treats users created during the signup flow as new', () => {
    const flowStartedAt = Date.parse('2026-06-23T12:00:00.000Z');
    const session = sessionWithCreatedAt('2026-06-23T12:00:02.000Z');
    expect(isExistingAuthUserAtSignup(session, flowStartedAt)).toBe(false);
  });

  it('allows a short grace window around flow start', () => {
    const flowStartedAt = Date.parse('2026-06-23T12:00:00.000Z');
    const session = sessionWithCreatedAt('2026-06-23T11:59:57.000Z');
    expect(isExistingAuthUserAtSignup(session, flowStartedAt)).toBe(false);
  });
});

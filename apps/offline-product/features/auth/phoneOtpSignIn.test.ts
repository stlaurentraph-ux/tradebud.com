import { describe, expect, it, vi } from 'vitest';

// `phoneOtpSignIn` imports `getSupabaseAuthClient` from the sync-auth module, which transitively
// pulls the full Expo/React Native runtime graph (OAuth orchestrator, app state, navigation/native
// packages) that cannot load under Node. The pure helper under test needs none of it, so stub the
// heavy dependency at the module boundary.
vi.mock('@/features/api/syncAuthSession', () => ({
  getSupabaseAuthClient: () => null,
}));

import { normalizePhoneForOtp } from './phoneOtpSignIn';

describe('phoneOtpSignIn', () => {
  it('normalizes farmer phone numbers to E.164', () => {
    expect(normalizePhoneForOtp('+233 24 123 4567')).toBe('+233241234567');
    expect(normalizePhoneForOtp('233241234567')).toBe('+233241234567');
    expect(normalizePhoneForOtp('abc')).toBeNull();
  });
});

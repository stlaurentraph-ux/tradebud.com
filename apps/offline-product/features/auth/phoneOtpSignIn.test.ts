import { describe, expect, it } from 'vitest';

import { normalizePhoneForOtp } from './phoneOtpSignIn';

describe('phoneOtpSignIn', () => {
  it('normalizes farmer phone numbers to E.164', () => {
    expect(normalizePhoneForOtp('+233 24 123 4567')).toBe('+233241234567');
    expect(normalizePhoneForOtp('233241234567')).toBe('+233241234567');
    expect(normalizePhoneForOtp('abc')).toBeNull();
  });
});

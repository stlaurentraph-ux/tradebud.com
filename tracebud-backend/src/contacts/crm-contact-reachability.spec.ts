import {
  assertFarmerReachability,
  assertNonFarmerEmail,
  normalizeFarmerPhoneE164,
  resolveFarmerReachability,
} from './crm-contact-reachability';

describe('crm-contact-reachability', () => {
  it('prefers email when both email and phone are present', () => {
    expect(
      resolveFarmerReachability({
        email: 'farmer@example.com',
        phone: '+233241234567',
      }),
    ).toEqual({
      email: 'farmer@example.com',
      phone: '+233241234567',
      digital_reachability: 'email',
    });
  });

  it('accepts phone-only farmers when phone_only is set', () => {
    expect(
      resolveFarmerReachability({
        email: '',
        phone: '233 24 123 4567',
        phone_only: true,
      }),
    ).toEqual({
      email: null,
      phone: '+233241234567',
      digital_reachability: 'phone',
    });
  });

  it('rejects farmer with neither email nor phone', () => {
    expect(() => assertFarmerReachability({ email: '', phone: '' })).toThrow(
      'Farmer contacts require an email or a phone number.',
    );
  });

  it('requires email for non-farmer contacts', () => {
    expect(() => assertNonFarmerEmail('')).toThrow('Email is required for this contact type.');
  });

  it('normalizes farmer phone to E.164', () => {
    expect(normalizeFarmerPhoneE164('+233 24 123 4567')).toBe('+233241234567');
  });
});

import { describe, expect, it } from 'vitest';
import { validateFarmerContactDraft } from '@/lib/crm-contact-reachability';

describe('crm-contact-reachability', () => {
  it('accepts email-first farmer contacts', () => {
    expect(
      validateFarmerContactDraft({
        email: 'farmer@example.com',
        phone: '',
        phoneOnlyNoEmail: false,
      }),
    ).toEqual({
      email: 'farmer@example.com',
      phone: null,
      error: null,
    });
  });

  it('accepts phone-only farmer contacts', () => {
    expect(
      validateFarmerContactDraft({
        email: '',
        phone: '+233241234567',
        phoneOnlyNoEmail: true,
      }),
    ).toEqual({
      email: null,
      phone: '+233241234567',
      error: null,
    });
  });
});

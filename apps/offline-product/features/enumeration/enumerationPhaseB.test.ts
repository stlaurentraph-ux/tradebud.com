import { describe, expect, it } from 'vitest';

import { findMemberDedupMatches } from '@/features/enumeration/memberDedup';
import type { FieldRosterEntry } from '@/features/enumeration/fieldRosterTypes';
import { validateProvisionalMemberInput } from '@/features/enumeration/validateProvisionalMember';

const baseEntry = (overrides: Partial<FieldRosterEntry>): FieldRosterEntry => ({
  farmerId: 'farmer-1',
  source: 'provisional',
  fullName: 'Maria Lopez',
  village: 'La Esperanza',
  phone: '+504 9999 1111',
  nationalId: null,
  email: 'maria@example.com',
  producerContactId: null,
  campaignId: null,
  assignmentId: null,
  status: 'pending',
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

describe('validateProvisionalMemberInput', () => {
  it('requires name and village', () => {
    expect(validateProvisionalMemberInput({ fullName: '', village: 'V' })).toBe('name_required');
    expect(validateProvisionalMemberInput({ fullName: 'A', village: '' })).toBe('village_required');
  });

  it('requires phone or national id', () => {
    expect(
      validateProvisionalMemberInput({ fullName: 'A', village: 'V', phone: '', nationalId: '' }),
    ).toBe('phone_or_id_required');
  });

  it('accepts phone-only or id-only members', () => {
    expect(
      validateProvisionalMemberInput({ fullName: 'A', village: 'V', phone: '99991111' }),
    ).toBeNull();
    expect(
      validateProvisionalMemberInput({ fullName: 'A', village: 'V', nationalId: 'HN-123' }),
    ).toBeNull();
  });

  it('validates optional email format', () => {
    expect(
      validateProvisionalMemberInput({
        fullName: 'A',
        village: 'V',
        phone: '999',
        email: 'not-an-email',
      }),
    ).toBe('invalid_email');
  });
});

describe('findMemberDedupMatches', () => {
  it('matches phone, national id, email, and name+village', () => {
    const roster = [
      baseEntry({ farmerId: 'a', phone: '+50499991111' }),
      baseEntry({ farmerId: 'b', phone: null, nationalId: 'HN-42', email: null }),
      baseEntry({
        farmerId: 'c',
        fullName: 'Juan Perez',
        village: 'Copan',
        phone: null,
        nationalId: null,
        email: null,
      }),
    ];

    expect(
      findMemberDedupMatches(
        { fullName: 'X', village: 'Y', phone: '504 9999 1111' },
        roster,
      )[0]?.reason,
    ).toBe('phone');

    expect(
      findMemberDedupMatches(
        { fullName: 'X', village: 'Y', nationalId: 'hn-42' },
        roster,
      )[0]?.reason,
    ).toBe('national_id');

    expect(
      findMemberDedupMatches(
        { fullName: 'X', village: 'Y', phone: '1', email: 'maria@example.com' },
        roster,
      )[0]?.reason,
    ).toBe('email');

    expect(
      findMemberDedupMatches(
        { fullName: 'juan perez', village: 'copan', phone: '000' },
        roster,
      )[0]?.reason,
    ).toBe('name_village');
  });
});

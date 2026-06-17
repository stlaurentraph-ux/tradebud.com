import { describe, expect, it } from 'vitest';
import { buildAddColleagueHref, listOrganizationColleagues } from './contact-directory';
import type { ContactRecord } from './contact-service';

const baseContact = (overrides: Partial<ContactRecord>): ContactRecord => ({
  id: 'contact_1',
  full_name: 'Amina Mwangi',
  email: 'amina@test.com',
  phone: null,
  organization: 'Kilimanjaro Coop',
  contact_type: 'cooperative',
  processing_subtype: null,
  status: 'new',
  country: 'TZ',
  tags: [],
  consent_status: 'unknown',
  farmer_profile_id: null,
  last_activity_at: null,
  created_at: '2026-04-22T10:00:00.000Z',
  updated_at: '2026-04-22T10:00:00.000Z',
  ...overrides,
});

describe('listOrganizationColleagues', () => {
  it('returns other contacts with the same organization', () => {
    const current = baseContact({ id: 'contact_1' });
    const contacts = [
      current,
      baseContact({ id: 'contact_2', full_name: 'Joseph Okello', email: 'joseph@test.com' }),
      baseContact({ id: 'contact_3', organization: 'Other Org', email: 'other@test.com' }),
    ];

    expect(listOrganizationColleagues(contacts, current)).toHaveLength(1);
    expect(listOrganizationColleagues(contacts, current)[0]?.id).toBe('contact_2');
  });
});

describe('buildAddColleagueHref', () => {
  it('prefills organization and activity fields', () => {
    const href = buildAddColleagueHref(
      baseContact({
        contact_type: 'processing_facility',
        processing_subtype: 'washing_station',
      }),
    );
    expect(href).toContain('mode=contact');
    expect(href).toContain('organization=Kilimanjaro');
    expect(href).toContain('contact_type=processing_facility');
    expect(href).toContain('processing_subtype=washing_station');
    expect(href).toContain('country=TZ');
  });
});

import {
  buildEnumerationContactTags,
  dedupePackMembers,
  provisionalContactEmail,
  villageFromContactTags,
} from './field-enumeration-pack';

describe('field-enumeration-pack helpers', () => {
  it('extracts village tag', () => {
    expect(villageFromContactTags(['enumeration:village:La Esperanza'])).toBe('La Esperanza');
  });

  it('builds provisional email slug', () => {
    expect(provisionalContactEmail('abc-def')).toContain('@tracebud.field.local');
  });

  it('dedupes members by farmerId', () => {
    const members = dedupePackMembers([
      {
        farmerId: 'f1',
        fullName: 'A',
        village: 'V',
        phone: null,
        nationalId: null,
        email: null,
        producerContactId: 'c1',
        assignmentId: null,
        plotCount: 1,
        source: 'roster',
      },
      {
        farmerId: 'f1',
        fullName: 'A',
        village: 'V',
        phone: '+504 1111',
        nationalId: null,
        email: null,
        producerContactId: null,
        assignmentId: null,
        plotCount: 2,
        source: 'roster',
      },
    ]);
    expect(members).toHaveLength(1);
    expect(members[0]?.phone).toBe('+504 1111');
  });

  it('builds contact tags', () => {
    expect(buildEnumerationContactTags({ village: 'X', nationalId: 'ID-1', provisional: true })).toEqual(
      ['enumeration:village:X', 'enumeration:national_id:ID-1', 'enumeration:provisional'],
    );
  });
});

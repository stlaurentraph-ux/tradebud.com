import { describe, expect, it } from 'vitest';

import {
  buildEnumerationContactTags,
  dedupePackMembers,
  nationalIdFromContactTags,
  provisionalContactEmail,
  villageFromContactTags,
} from '@/features/enumeration/mergeEnumerationPack';

describe('mergeEnumerationPack helpers', () => {
  it('extracts village and national id tags', () => {
    expect(villageFromContactTags(['enumeration:village:La Esperanza', 'other'])).toBe(
      'La Esperanza',
    );
    expect(nationalIdFromContactTags(['enumeration:national_id:HN-123'])).toBe('HN-123');
  });

  it('builds stable provisional contact email', () => {
    expect(provisionalContactEmail('abc-123')).toContain('@tracebud.field.local');
  });

  it('dedupes pack members by farmerId', () => {
    const merged = dedupePackMembers([
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
    expect(merged).toHaveLength(1);
    expect(merged[0]?.phone).toBe('+504 1111');
    expect(merged[0]?.plotCount).toBe(2);
  });

  it('builds contact tags for provisional sync', () => {
    expect(buildEnumerationContactTags({ village: 'X', nationalId: 'ID-1', provisional: true })).toEqual(
      ['enumeration:village:X', 'enumeration:national_id:ID-1', 'enumeration:provisional'],
    );
  });
});

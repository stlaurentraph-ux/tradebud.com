import type { FieldRosterEntry, ProvisionalMemberInput } from '@/features/enumeration/fieldRosterTypes';
import {
  normalizeMemberEmail,
  normalizeMemberPhone,
} from '@/features/enumeration/validateProvisionalMember';

export type MemberDedupReason = 'phone' | 'national_id' | 'email' | 'name_village';

export type MemberDedupMatch = {
  reason: MemberDedupReason;
  entry: FieldRosterEntry;
};

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function findMemberDedupMatches(
  input: ProvisionalMemberInput,
  existing: FieldRosterEntry[],
): MemberDedupMatch[] {
  const matches: MemberDedupMatch[] = [];
  const phone = input.phone?.trim() ? normalizeMemberPhone(input.phone.trim()) : '';
  const nationalId = input.nationalId?.trim().toLowerCase() ?? '';
  const email = input.email?.trim() ? normalizeMemberEmail(input.email.trim()) : '';
  const nameVillageKey = `${normalizeName(input.fullName)}|${normalizeName(input.village)}`;

  for (const entry of existing) {
    if (phone && entry.phone && normalizeMemberPhone(entry.phone) === phone) {
      matches.push({ reason: 'phone', entry });
      continue;
    }
    if (nationalId && entry.nationalId?.trim().toLowerCase() === nationalId) {
      matches.push({ reason: 'national_id', entry });
      continue;
    }
    if (email && entry.email && normalizeMemberEmail(entry.email) === email) {
      matches.push({ reason: 'email', entry });
      continue;
    }
    const entryKey = `${normalizeName(entry.fullName)}|${normalizeName(entry.village)}`;
    if (entryKey === nameVillageKey) {
      matches.push({ reason: 'name_village', entry });
    }
  }

  return matches;
}

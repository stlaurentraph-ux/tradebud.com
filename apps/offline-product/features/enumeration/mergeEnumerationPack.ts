import type { FieldEnumerationPackMember } from '@/features/enumeration/fieldEnumerationPackTypes';

const VILLAGE_TAG_PREFIX = 'enumeration:village:';
const NATIONAL_ID_TAG_PREFIX = 'enumeration:national_id:';

export function villageFromContactTags(tags: string[] | null | undefined): string | null {
  if (!Array.isArray(tags)) return null;
  const match = tags.find((tag) => tag.startsWith(VILLAGE_TAG_PREFIX));
  return match ? match.slice(VILLAGE_TAG_PREFIX.length).trim() || null : null;
}

export function nationalIdFromContactTags(tags: string[] | null | undefined): string | null {
  if (!Array.isArray(tags)) return null;
  const match = tags.find((tag) => tag.startsWith(NATIONAL_ID_TAG_PREFIX));
  return match ? match.slice(NATIONAL_ID_TAG_PREFIX.length).trim() || null : null;
}

export function buildEnumerationContactTags(input: {
  village: string;
  nationalId?: string | null;
  provisional?: boolean;
}): string[] {
  const tags = [`${VILLAGE_TAG_PREFIX}${input.village.trim()}`];
  const nationalId = input.nationalId?.trim();
  if (nationalId) {
    tags.push(`${NATIONAL_ID_TAG_PREFIX}${nationalId}`);
  }
  if (input.provisional) {
    tags.push('enumeration:provisional');
  }
  return tags;
}

export function provisionalContactEmail(farmerId: string): string {
  const slug = farmerId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 48) || 'member';
  return `provisional+${slug}@tracebud.field.local`;
}

export function dedupePackMembers(members: FieldEnumerationPackMember[]): FieldEnumerationPackMember[] {
  const byFarmerId = new Map<string, FieldEnumerationPackMember>();
  for (const member of members) {
    const existing = byFarmerId.get(member.farmerId);
    if (!existing) {
      byFarmerId.set(member.farmerId, member);
      continue;
    }
    byFarmerId.set(member.farmerId, {
      ...existing,
      producerContactId: existing.producerContactId ?? member.producerContactId,
      phone: existing.phone ?? member.phone,
      email: existing.email ?? member.email,
      nationalId: existing.nationalId ?? member.nationalId,
      village: existing.village ?? member.village,
      plotCount: Math.max(existing.plotCount, member.plotCount),
    });
  }
  return Array.from(byFarmerId.values()).sort((a, b) =>
    a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' }),
  );
}

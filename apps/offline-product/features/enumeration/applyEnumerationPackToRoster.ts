import type { FieldEnumerationPackResponse } from '@/features/enumeration/fieldEnumerationPackTypes';
import {
  loadFieldRosterEntries,
  persistFieldRosterEntry,
  setSetting,
  type FieldRosterEntryRow,
} from '@/features/state/persistence';

const PACK_CAMPAIGN_SETTING = 'enumeration_pack_campaign_id';
const PACK_FETCHED_AT_SETTING = 'enumeration_pack_fetched_at';

export type MergeEnumerationPackResult = {
  inserted: number;
  updated: number;
  preservedProvisionals: number;
};

export async function mergeEnumerationPackIntoRoster(
  pack: FieldEnumerationPackResponse,
): Promise<MergeEnumerationPackResult> {
  const existing = await loadFieldRosterEntries();
  const existingByFarmerId = new Map(existing.map((row) => [row.farmerId, row]));
  let inserted = 0;
  let updated = 0;

  for (const member of pack.members) {
    const prior = existingByFarmerId.get(member.farmerId);
    const now = Date.now();
    const row: FieldRosterEntryRow = {
      farmerId: member.farmerId,
      source: 'roster',
      fullName: member.fullName,
      village: member.village?.trim() || 'Unknown',
      phone: member.phone,
      nationalId: member.nationalId,
      email: member.email,
      producerContactId: member.producerContactId,
      campaignId: pack.campaignId,
      assignmentId: member.assignmentId,
      status: prior?.status ?? 'pending',
      createdAt: prior?.createdAt ?? now,
      updatedAt: now,
    };
    if (prior) {
      updated += 1;
    } else {
      inserted += 1;
    }
    await persistFieldRosterEntry(row);
  }

  await setSetting(PACK_CAMPAIGN_SETTING, pack.campaignId ?? '');
  await setSetting(PACK_FETCHED_AT_SETTING, pack.prefetchedAt);

  const preservedProvisionals = existing.filter((row) => row.source === 'provisional').length;
  return { inserted, updated, preservedProvisionals };
}

export async function listUnsyncedProvisionalRosterEntries(): Promise<FieldRosterEntryRow[]> {
  const rows = await loadFieldRosterEntries();
  return rows.filter(
    (row) => row.source === 'provisional' && !row.producerContactId?.trim(),
  );
}

export async function markProvisionalRosterLinked(
  farmerId: string,
  producerContactId: string | null,
): Promise<void> {
  const rows = await loadFieldRosterEntries();
  const row = rows.find((entry) => entry.farmerId === farmerId);
  if (!row) return;
  await persistFieldRosterEntry({
    ...row,
    producerContactId: producerContactId?.trim() || row.producerContactId,
    updatedAt: Date.now(),
  });
}

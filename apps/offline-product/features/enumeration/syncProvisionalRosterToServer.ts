import { syncEnumerationProvisionalMember } from '@/features/enumeration/fetchFieldEnumerationPack';
import {
  listUnsyncedProvisionalRosterEntries,
  markProvisionalRosterLinked,
} from '@/features/enumeration/applyEnumerationPackToRoster';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';

export type SyncProvisionalRosterResult = {
  synced: number;
  failed: number;
  duplicateWarnings: number;
};

export async function syncAllProvisionalRosterMembers(): Promise<SyncProvisionalRosterResult> {
  const pending = await listUnsyncedProvisionalRosterEntries();
  let synced = 0;
  let failed = 0;
  let duplicateWarnings = 0;

  for (const row of pending) {
    const response = await syncEnumerationProvisionalMember({
      farmerId: row.farmerId,
      fullName: row.fullName,
      village: row.village,
      phone: row.phone,
      nationalId: row.nationalId,
      email: row.email,
      campaignId: row.campaignId,
    });
    if (!response.ok) {
      failed += 1;
      continue;
    }
    synced += 1;
    duplicateWarnings += response.result.duplicateWarnings.length;
    await markProvisionalRosterLinked(row.farmerId, response.result.producerContactId);
    if (response.result.duplicateWarnings.length > 0) {
      trackEvent(ANALYTICS_EVENTS.ENUMERATION_DUPLICATE_WARNING_SHOWN, {
        farmerId: row.farmerId,
        matchCount: response.result.duplicateWarnings.length,
        phase: 'provisional_sync',
      });
    }
  }

  return { synced, failed, duplicateWarnings };
}

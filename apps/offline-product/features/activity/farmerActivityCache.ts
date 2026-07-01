import { getSetting, setSetting } from '@/features/state/persistence';

import type { FarmerActivityFeedSnapshot } from './farmerActivityTypes';

export const FARMER_ACTIVITY_CACHE_KEY = 'farmerActivityFeedV1';

export async function loadFarmerActivityCache(): Promise<FarmerActivityFeedSnapshot | null> {
  const raw = await getSetting(FARMER_ACTIVITY_CACHE_KEY).catch(() => null);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FarmerActivityFeedSnapshot;
    if (!parsed || !Array.isArray(parsed.items) || typeof parsed.fetchedAt !== 'string') {
      return null;
    }
    return {
      fetchedAt: parsed.fetchedAt,
      items: parsed.items,
      actionCount:
        typeof parsed.actionCount === 'number'
          ? parsed.actionCount
          : parsed.items.filter((item) => item.severity === 'action').length,
    };
  } catch {
    return null;
  }
}

export async function saveFarmerActivityCache(snapshot: FarmerActivityFeedSnapshot): Promise<void> {
  await setSetting(FARMER_ACTIVITY_CACHE_KEY, JSON.stringify(snapshot));
}

export function formatActivityTimestamp(iso: string | null, lang: string): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleDateString(lang, { month: 'short', day: 'numeric' });
}

export function formatActivityLastUpdated(iso: string, lang: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  return new Date(ms).toLocaleString(lang, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

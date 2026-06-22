import { beforeEach, describe, expect, it, vi } from 'vitest';

const settings = new Map<string, string>();

vi.mock('@/features/state/persistence', () => ({
  getSetting: vi.fn(async (key: string) => settings.get(key) ?? null),
  setSetting: vi.fn(async (key: string, value: string) => {
    settings.set(key, value);
  }),
}));

import {
  dismissDeliveryReceiptIds,
  filterDismissedDeliveryReceipts,
  loadDismissedDeliveryReceiptIds,
} from './dismissedDeliveryReceipts';

describe('dismissedDeliveryReceipts', () => {
  beforeEach(() => {
    settings.clear();
  });
  it('filters dismissed receipt ids from a list', () => {
    const filtered = filterDismissedDeliveryReceipts(
      [
        { id: 'keep-me', plotId: 'p1' },
        { id: 'hide-me', plotId: 'p2' },
      ],
      new Set(['hide-me']),
    );
    expect(filtered.map((row) => row.id)).toEqual(['keep-me']);
  });

  it('persists dismissed ids in settings', async () => {
    await dismissDeliveryReceiptIds(['voucher-1', 'harvest-1']);
    const ids = await loadDismissedDeliveryReceiptIds();
    expect(ids.has('voucher-1')).toBe(true);
    expect(ids.has('harvest-1')).toBe(true);
  });
});

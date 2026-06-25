import { beforeEach, describe, expect, it, vi } from 'vitest';

const settings = new Map<string, string>();

vi.mock('@/features/state/persistence', () => ({
  getSetting: vi.fn(async (key: string) => settings.get(key) ?? null),
  setSetting: vi.fn(async (key: string, value: string) => {
    settings.set(key, value);
  }),
  deleteSetting: vi.fn(async (key: string) => {
    settings.delete(key);
  }),
}));

import {
  isCampaignInviteDeepLink,
  parseCampaignClaimTokenFromUrl,
  parseCampaignIdFromUrl,
  persistPendingCampaignClaimToken,
  persistPendingCampaignInviteId,
  persistPendingCampaignInvitePreview,
  readPendingCampaignClaimToken,
  readPendingCampaignInviteId,
  readPendingCampaignInvitePreview,
} from './campaignInviteContext';

describe('campaignInviteContext', () => {
  beforeEach(() => {
    settings.clear();
  });

  it('parses campaign id from field-auth and app deep links', () => {
    expect(
      parseCampaignIdFromUrl('https://app.tracebud.com/campaign?campaign=camp-123'),
    ).toBe('camp-123');
    expect(parseCampaignIdFromUrl('tracebudoffline://campaign?campaign=camp-abc')).toBe('camp-abc');
    expect(isCampaignInviteDeepLink('tracebudoffline://campaign?campaign=camp-abc')).toBe(true);
  });

  it('persists pending campaign invite', async () => {
    await persistPendingCampaignInviteId('camp-xyz');
    await expect(readPendingCampaignInviteId()).resolves.toBe('camp-xyz');
  });

  it('parses claim token from invite deep links', () => {
    expect(
      parseCampaignClaimTokenFromUrl(
        'tracebudoffline://campaign?campaign=camp-abc&token=opaque-token',
      ),
    ).toBe('opaque-token');
  });

  it('persists pending claim token', async () => {
    await persistPendingCampaignClaimToken('tok-123');
    await expect(readPendingCampaignClaimToken()).resolves.toBe('tok-123');
  });

  it('persists and reads campaign invite preview', async () => {
    await persistPendingCampaignInvitePreview({
      campaignId: 'camp-1',
      title: 'Land papers',
      fromOrg: 'Coop A',
      dueAt: null,
      senderTenantId: 'tenant_a',
    });
    await expect(readPendingCampaignInvitePreview()).resolves.toMatchObject({
      campaignId: 'camp-1',
      fromOrg: 'Coop A',
    });
  });
});

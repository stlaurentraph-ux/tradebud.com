import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isCampaignInviteDeepLink,
  parseCampaignIdFromUrl,
  persistPendingCampaignInviteId,
  persistPendingCampaignInvitePreview,
  readPendingCampaignInviteId,
  readPendingCampaignInvitePreview,
} from './campaignInviteContext';

describe('campaignInviteContext', () => {
  beforeEach(() => {
    vi.mocked(AsyncStorage.getItem).mockReset();
    vi.mocked(AsyncStorage.setItem).mockReset();
    vi.mocked(AsyncStorage.removeItem).mockReset();
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
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('tracebud_pending_campaign_invite', 'camp-xyz');
    vi.mocked(AsyncStorage.getItem).mockResolvedValue('camp-xyz');
    await expect(readPendingCampaignInviteId()).resolves.toBe('camp-xyz');
  });

  it('persists and reads campaign invite preview', async () => {
    await persistPendingCampaignInvitePreview({
      campaignId: 'camp-1',
      title: 'Land papers',
      fromOrg: 'Coop A',
      dueAt: null,
      senderTenantId: 'tenant_a',
    });
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(
      JSON.stringify({
        campaignId: 'camp-1',
        title: 'Land papers',
        fromOrg: 'Coop A',
        dueAt: null,
        senderTenantId: 'tenant_a',
      }),
    );
    await expect(readPendingCampaignInvitePreview()).resolves.toMatchObject({
      campaignId: 'camp-1',
      fromOrg: 'Coop A',
    });
  });
});

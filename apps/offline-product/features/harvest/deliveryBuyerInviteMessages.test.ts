import { describe, expect, it } from 'vitest';

import {
  formatBuyerInviteMessage,
  isUnknownBuyerEmailError,
} from '@/features/harvest/deliveryBuyerInviteMessages';
import { readHarvestSubmitBuyerInvite } from '@/features/harvest/readHarvestSubmitBuyerInvite';

const t = (key: string, params?: Record<string, string | number>) => {
  if (key === 'delivery_buyer_invite_sent') {
    return `Invite sent to ${params?.email ?? ''}`;
  }
  if (key === 'delivery_buyer_invite_saved') {
    return `Saved ${params?.email ?? ''}`;
  }
  return key;
};

describe('readHarvestSubmitBuyerInvite', () => {
  it('reads pending invite from harvest response', () => {
    expect(
      readHarvestSubmitBuyerInvite({
        buyerInvite: { email: 'buyer@coop.org', pending: true, inviteSent: false },
      }),
    ).toEqual({
      email: 'buyer@coop.org',
      pending: true,
      inviteSent: false,
    });
  });
});

describe('deliveryBuyerInviteMessages', () => {
  it('detects legacy unknown buyer message', () => {
    expect(
      isUnknownBuyerEmailError(
        'No buyer organisation found for that email. Pick a buyer from your list or share the QR code directly.',
      ),
    ).toBe(true);
  });

  it('formats invite saved copy', () => {
    expect(
      formatBuyerInviteMessage(
        { email: 'buyer@coop.org', pending: true, inviteSent: false },
        t,
      ),
    ).toBe('Saved buyer@coop.org');
  });
});

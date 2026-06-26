import type { TranslateFn } from '@/features/i18n/translate';
import type { HarvestBuyerInvite } from '@/features/harvest/readHarvestSubmitBuyerInvite';

/** Legacy API error before pending-invite routing shipped. */
export function isUnknownBuyerEmailError(message: string | undefined | null): boolean {
  const text = (message ?? '').trim().toLowerCase();
  if (!text) return false;
  return (
    text.includes('no buyer organisation found') ||
    text.includes('delivery_buyer_not_on_tracebud')
  );
}

export function formatBuyerInviteMessage(
  invite: HarvestBuyerInvite,
  t: TranslateFn,
): string {
  if (invite.inviteSent) {
    return t('delivery_buyer_invite_sent', { email: invite.email });
  }
  return t('delivery_buyer_invite_saved', { email: invite.email });
}

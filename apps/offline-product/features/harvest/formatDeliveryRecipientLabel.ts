import type { DeliveryRecipientSelection } from '@/features/harvest/DeliveryRecipientFields';
import type { TranslateFn } from '@/features/i18n/translate';

export function formatDeliveryRecipientLabel(
  recipient: DeliveryRecipientSelection | null | undefined,
  t: TranslateFn,
): string {
  if (!recipient) return t('harvest_receipt_buyer_unspecified');
  if (recipient.mode === 'buyer') {
    return recipient.label?.trim() || t('delivery_recipient_buyer_option');
  }
  if (recipient.mode === 'email') {
    return recipient.email.trim();
  }
  return t('harvest_receipt_buyer_qr_only');
}

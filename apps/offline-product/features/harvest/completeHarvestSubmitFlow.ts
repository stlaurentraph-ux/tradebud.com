import { Alert } from 'react-native';

import type { DeliveryRecipientSelection } from '@/features/harvest/DeliveryRecipientFields';
import {
  formatBuyerInviteMessage,
  isUnknownBuyerEmailError,
} from '@/features/harvest/deliveryBuyerInviteMessages';
import type { HarvestBuyerInvite } from '@/features/harvest/readHarvestSubmitBuyerInvite';
import type { SubmitHarvestResult } from '@/features/harvest/submitHarvest';
import type { TranslateFn } from '@/features/i18n/translate';

export { formatBuyerInviteMessage, isUnknownBuyerEmailError } from '@/features/harvest/deliveryBuyerInviteMessages';

export function showBuyerInviteAlert(params: {
  t: TranslateFn;
  invite: HarvestBuyerInvite;
  onContinue: () => void;
}): void {
  Alert.alert(
    params.t('delivery_buyer_invite_title'),
    formatBuyerInviteMessage(params.invite, params.t),
    [{ text: params.t('delivery_buyer_invite_continue'), onPress: params.onContinue }],
  );
}

export function promptLegacyUnknownBuyerQrFallback(params: {
  t: TranslateFn;
  onRetryQrOnly: () => void | Promise<void>;
  onCancel?: () => void;
}): void {
  Alert.alert(
    params.t('delivery_unknown_buyer_title'),
    params.t('delivery_unknown_buyer_body'),
    [
      { text: params.t('cancel'), style: 'cancel', onPress: params.onCancel },
      {
        text: params.t('delivery_unknown_buyer_qr_only'),
        onPress: () => {
          void params.onRetryQrOnly();
        },
      },
    ],
  );
}

export async function resolveHarvestSubmitWithUnknownBuyerFallback(params: {
  result: SubmitHarvestResult;
  t: TranslateFn;
  retryWithRecipient: (recipient: DeliveryRecipientSelection) => Promise<SubmitHarvestResult>;
}): Promise<SubmitHarvestResult> {
  if (params.result.status !== 'error') {
    return params.result;
  }
  const isUnknown =
    params.result.messageKey === 'delivery_unknown_buyer_email' ||
    isUnknownBuyerEmailError(params.result.message);
  if (!isUnknown) {
    return params.result;
  }

  return new Promise((resolve) => {
    promptLegacyUnknownBuyerQrFallback({
      t: params.t,
      onCancel: () => resolve(params.result),
      onRetryQrOnly: async () => {
        resolve(await params.retryWithRecipient({ mode: 'qr_only' }));
      },
    });
  });
}

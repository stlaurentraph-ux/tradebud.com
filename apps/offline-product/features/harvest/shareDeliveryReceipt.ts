import { type RefObject } from 'react';
import { Platform, Share, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export async function shareDeliveryReceipt(params: {
  captureRef: RefObject<View | null>;
  shareTitle: string;
  shareMessage: string;
}): Promise<void> {
  if (Platform.OS === 'web') {
    await Share.share({ title: params.shareTitle, message: params.shareMessage });
    return;
  }

  await new Promise<void>((resolve) => setTimeout(() => resolve(), 150));
  const uri = await captureRef(params.captureRef, {
    format: 'png',
    quality: 0.95,
    result: 'tmpfile',
  });
  const available = await Sharing.isAvailableAsync();
  if (available && uri) {
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: params.shareTitle,
    });
    return;
  }
  await Share.share({ title: params.shareTitle, message: params.shareMessage });
}

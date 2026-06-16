import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { registerPushDevice } from '@/features/api/pushDevices';
import { requestPushPermission } from '@/features/permissions/pushPermission';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';

export type RegisterFarmerPushTokenOptions = {
  /** When true, invoke `onPermissionDenied` after the user declines push access. */
  alertOnDeny?: boolean;
  onPermissionDenied?: () => void;
};

export type RegisterFarmerPushTokenResult =
  | { ok: true }
  | { ok: false; reason: 'denied' | 'unavailable' | 'no_token' };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerFarmerPushToken(
  options?: RegisterFarmerPushTokenOptions,
): Promise<RegisterFarmerPushTokenResult> {
  if (Platform.OS === 'web') {
    return { ok: false, reason: 'unavailable' };
  }

  const permission = await requestPushPermission();
  if (permission === 'unavailable') {
    return { ok: false, reason: 'unavailable' };
  }
  if (permission === 'denied') {
    trackEvent(ANALYTICS_EVENTS.PUSH_PERMISSION_DENIED);
    if (options?.alertOnDeny) {
      options.onPermissionDenied?.();
    }
    return { ok: false, reason: 'denied' };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.projectId;
  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId: String(projectId) } : undefined,
  );
  const pushToken = tokenResult.data?.trim();
  if (!pushToken) {
    return { ok: false, reason: 'no_token' };
  }

  await registerPushDevice({
    pushToken,
    platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'unknown',
  });
  return { ok: true };
}

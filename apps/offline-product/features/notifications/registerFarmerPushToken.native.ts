import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { registerPushDevice, unregisterPushDevice } from '@/features/api/pushDevices';
import { ensureAndroidNotificationChannel } from '@/features/notifications/androidNotificationChannel';
import { requestPushPermission } from '@/features/permissions/pushPermission';
import { getSetting } from '@/features/state/persistence';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';

import { PUSH_NOTIFICATIONS_OPT_IN_KEY } from '@/features/notifications/pushSettings';

export type RegisterFarmerPushTokenOptions = {
  /** When true, invoke `onPermissionDenied` after the user declines push access. */
  alertOnDeny?: boolean;
  onPermissionDenied?: () => void;
};

export type RegisterFarmerPushTokenResult =
  | { ok: true }
  | { ok: false; reason: 'denied' | 'unavailable' | 'no_token' | 'opted_out' };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function readCurrentExpoPushToken(): Promise<string | null> {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.projectId;
  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId: String(projectId) } : undefined,
    );
    const pushToken = tokenResult.data?.trim();
    return pushToken || null;
  } catch {
    // Dev builds without FCM / google-services.json — push is optional.
    return null;
  }
}

export async function registerFarmerPushToken(
  options?: RegisterFarmerPushTokenOptions,
): Promise<RegisterFarmerPushTokenResult> {
  if (Platform.OS === 'web') {
    return { ok: false, reason: 'unavailable' };
  }

  const optIn = await getSetting(PUSH_NOTIFICATIONS_OPT_IN_KEY).catch(() => null);
  if (optIn === '0') {
    return { ok: false, reason: 'opted_out' };
  }

  // Android needs a high-importance channel before any notification can present as a heads-up.
  await ensureAndroidNotificationChannel().catch(() => undefined);

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

  const pushToken = await readCurrentExpoPushToken();
  if (!pushToken) {
    return { ok: false, reason: 'no_token' };
  }

  await registerPushDevice({
    pushToken,
    platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'unknown',
  });
  return { ok: true };
}

/** Remove this device's push token from Tracebud and respect local opt-out. */
export async function unregisterFarmerPushToken(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  const pushToken = await readCurrentExpoPushToken().catch(() => null);
  if (pushToken) {
    await unregisterPushDevice({ pushToken });
  }
}

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export const ANDROID_DEFAULT_CHANNEL_ID = 'default';

/**
 * Android 8+ (API 26+) requires every notification to belong to a channel. Without an explicit one,
 * expo-notifications falls back to a default/low-importance channel, so consent reminders and backup
 * alerts never show as a heads-up banner or play a sound — even though the foreground handler asks
 * for a banner. iOS has no notification channels, so this is a no-op there.
 *
 * Idempotent: creating a channel with an existing id updates it in place.
 */
export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_DEFAULT_CHANNEL_ID, {
    name: 'Tracebud alerts',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

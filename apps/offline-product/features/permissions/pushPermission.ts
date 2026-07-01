import { Alert, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

type Translate = (key: string) => string;

export type PushPermissionResult = 'granted' | 'denied' | 'unavailable';

type PermissionFields = {
  granted?: boolean;
  status?: 'granted' | 'denied' | 'undetermined';
};

function isPushGranted(permissions: Notifications.NotificationPermissionsStatus): boolean {
  const fields = permissions as Notifications.NotificationPermissionsStatus & PermissionFields;
  if (fields.granted === true || fields.status === 'granted') return true;
  return permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function getPushPermissionStatus(): Promise<PushPermissionResult> {
  if (Platform.OS === 'web') return 'unavailable';
  const permissions = await Notifications.getPermissionsAsync();
  if (isPushGranted(permissions)) {
    return 'granted';
  }
  return 'denied';
}

/** Farmer-friendly alert when push is required but denied (consent reminders, backup alerts). */
export function alertPushPermissionDenied(t: Translate): void {
  const buttons: Array<{ text: string; style?: 'cancel'; onPress?: () => void }> = [
    { text: t('cancel'), style: 'cancel' },
  ];
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    buttons.push({
      text: t('open_settings'),
      onPress: () => {
        void Linking.openSettings();
      },
    });
  }
  Alert.alert(t('perm_push_title'), t('perm_push_body'), buttons);
}

export async function requestPushPermission(): Promise<PushPermissionResult> {
  if (Platform.OS === 'web') return 'unavailable';
  const current = await Notifications.getPermissionsAsync();
  if (isPushGranted(current)) {
    return 'granted';
  }
  const requested = await Notifications.requestPermissionsAsync();
  if (isPushGranted(requested)) {
    return 'granted';
  }
  return 'denied';
}

export async function requestPushPermissionOrAlert(t: Translate): Promise<boolean> {
  const result = await requestPushPermission();
  if (result === 'granted') return true;
  if (result === 'denied') {
    alertPushPermissionDenied(t);
  }
  return false;
}

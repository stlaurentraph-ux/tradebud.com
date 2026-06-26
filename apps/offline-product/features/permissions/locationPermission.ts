import { Alert, Linking, Platform, type AlertButton } from 'react-native';
import * as Location from 'expo-location';

type Translate = (key: string) => string;

export async function requestForegroundLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/** Farmer-friendly alert when location is required but denied (walk plot, declaration GPS). */
export function alertLocationPermissionDenied(t: Translate): void {
  const buttons: AlertButton[] = [{ text: t('cancel'), style: 'cancel' }];
  if (Platform.OS !== 'web') {
    buttons.push({
      text: t('open_settings'),
      onPress: () => {
        void Linking.openSettings();
      },
    });
  }
  Alert.alert(t('perm_location_title'), t('perm_location_body'), buttons);
}

export async function requestForegroundLocationOrAlert(t: Translate): Promise<boolean> {
  const granted = await requestForegroundLocationPermission();
  if (!granted) {
    alertLocationPermissionDenied(t);
  }
  return granted;
}

/**
 * Android-focused: permission is granted but the device Location master switch is off, so GPS will
 * never produce a fix. Offer to open the OS location settings. On Android this deep-links to the
 * location source settings; on iOS it falls back to the app settings.
 */
export function alertLocationServicesOff(t: Translate): void {
  const buttons: AlertButton[] = [{ text: t('cancel'), style: 'cancel' }];
  if (Platform.OS !== 'web') {
    buttons.push({
      text: t('open_settings'),
      onPress: () => {
        // Android deep-links straight to the location source settings (with a settings fallback);
        // iOS has no such screen, so open the app settings.
        if (Platform.OS === 'android') {
          void Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => {
            void Linking.openSettings();
          });
          return;
        }
        void Linking.openSettings();
      },
    });
  }
  Alert.alert(t('perm_location_services_off_title'), t('perm_location_services_off_body'), buttons);
}

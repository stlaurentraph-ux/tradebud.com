import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

type Translate = (key: string) => string;

export async function requestForegroundLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/** Farmer-friendly alert when location is required but denied (walk plot, declaration GPS). */
export function alertLocationPermissionDenied(t: Translate): void {
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
  Alert.alert(t('perm_location_title'), t('perm_location_body'), buttons);
}

export async function requestForegroundLocationOrAlert(t: Translate): Promise<boolean> {
  const granted = await requestForegroundLocationPermission();
  if (!granted) {
    alertLocationPermissionDenied(t);
  }
  return granted;
}

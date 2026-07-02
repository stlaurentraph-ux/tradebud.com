import Constants from 'expo-constants';
import { Platform, TurboModuleRegistry } from 'react-native';

/** True when the native Android build embeds a Google Maps SDK API key. */
export function isAndroidGoogleMapsConfigured(): boolean {
  const extraFlag = Constants.expoConfig?.extra?.googleMapsConfigured;
  if (typeof extraFlag === 'boolean') return extraFlag;

  const androidKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey?.trim();
  return Boolean(androidKey);
}

/** True when react-native-maps registered its TurboModule in the installed native binary. */
export function isRnMapsNativeModuleAvailable(): boolean {
  if (Platform.OS !== 'android') return true;
  try {
    return TurboModuleRegistry.get('RNMapsAirModule') != null;
  } catch {
    return false;
  }
}

/** True on Android when MapView must not mount (missing SDK key or native module). */
export function shouldBlockNativeMapView(): boolean {
  if (Platform.OS !== 'android') return false;
  if (!isAndroidGoogleMapsConfigured()) return true;
  return !isRnMapsNativeModuleAvailable();
}

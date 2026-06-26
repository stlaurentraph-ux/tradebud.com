import Constants from 'expo-constants';

/** True when the native Android build embeds a Google Maps SDK API key. */
export function isAndroidGoogleMapsConfigured(): boolean {
  const extraFlag = Constants.expoConfig?.extra?.googleMapsConfigured;
  if (typeof extraFlag === 'boolean') return extraFlag;

  const androidKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey?.trim();
  return Boolean(androidKey);
}

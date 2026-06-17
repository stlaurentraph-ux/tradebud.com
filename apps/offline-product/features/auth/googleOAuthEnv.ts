/**
 * Static env references so Metro inlines EXPO_PUBLIC_GOOGLE_* into OTA bundles.
 * Imported from app root — do not load this module only via dynamic import.
 */
export const GOOGLE_OAUTH_ENV = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ?? '',
} as const;

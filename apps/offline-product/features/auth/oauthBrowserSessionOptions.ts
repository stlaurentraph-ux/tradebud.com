import { Platform } from 'react-native';

import {
  oauthBrowserSessionOptionsForPlatform,
} from '@/features/auth/oauthBrowserSessionOptionsPolicy';
import type { AuthSessionOpenOptions } from 'expo-web-browser';

export { oauthBrowserSessionOptionsForPlatform } from '@/features/auth/oauthBrowserSessionOptionsPolicy';

export function getOAuthBrowserSessionOptions(): AuthSessionOpenOptions {
  return oauthBrowserSessionOptionsForPlatform(Platform.OS);
}

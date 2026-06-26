import { Platform } from 'react-native';
import type { AuthRequestPromptOptions } from 'expo-auth-session';

/**
 * Android Custom Tabs default to createTask:true, which opens OAuth in a separate Chrome
 * task. After redirect the user can remain on google.com while the app resumes elsewhere.
 */
export function getOAuthBrowserSessionOptions(): AuthRequestPromptOptions {
  if (Platform.OS === 'android') {
    return {
      createTask: false,
      showInRecents: false,
    };
  }
  return {};
}

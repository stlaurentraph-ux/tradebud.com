import type { AuthSessionOpenOptions } from 'expo-web-browser';

/**
 * Android Chrome Custom Tabs default to createTask:true, which leaves a full
 * browser task on google.com after oauth2redirect. Keep the tab in-app.
 */
export function oauthBrowserSessionOptionsForPlatform(
  platformOs: string,
): AuthSessionOpenOptions {
  if (platformOs === 'android') {
    return { createTask: false, showInRecents: false };
  }
  return { showInRecents: true };
}

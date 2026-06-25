import * as WebBrowser from 'expo-web-browser';

/** Close a stuck Chrome Custom Tab after OAuth redirected back to the app. */
export async function dismissOAuthBrowserIfOpen(): Promise<void> {
  try {
    WebBrowser.maybeCompleteAuthSession();
  } catch {
    // Unsupported on some platforms.
  }
  try {
    await WebBrowser.dismissBrowser();
  } catch {
    // No auth session tab open.
  }
  try {
    await WebBrowser.coolDownAsync();
  } catch {
    // Unsupported on some platforms.
  }
}

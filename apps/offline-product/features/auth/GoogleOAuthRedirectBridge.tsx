import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { isGoogleNativeOAuthRedirectUrl, isOAuthCallbackUrl } from '@/features/auth/oauthCallbackUrlPolicy';

function shouldDismissOAuthBrowser(url: string): boolean {
  return isGoogleNativeOAuthRedirectUrl(url) || isOAuthCallbackUrl(url);
}

/** Close Chrome Custom Tabs on OAuth returns so Metro is not loaded inside the tab. */
export function GoogleOAuthRedirectBridge() {
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url || !shouldDismissOAuthBrowser(url)) return;
      void WebBrowser.dismissBrowser();
    };

    void Linking.getInitialURL().then(handleUrl);

    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => subscription.remove();
  }, []);

  return null;
}

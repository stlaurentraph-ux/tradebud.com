import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

/**
 * Google native sign-in returns to tracebudoffline://oauth2redirect (Android) or
 * com.googleusercontent.apps.*:/oauth2redirect (iOS). Routed via app/+native-intent.tsx.
 */
export default function GoogleOAuthRedirectScreen() {
  const params = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();

    void Linking.getInitialURL().then((url) => {
      if (url?.includes('oauth2redirect')) {
        WebBrowser.maybeCompleteAuthSession();
      }
    });

    const timer = setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace('/(tabs)/settings');
    }, params.code ? 800 : 400);

    return () => clearTimeout(timer);
  }, [params.code]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

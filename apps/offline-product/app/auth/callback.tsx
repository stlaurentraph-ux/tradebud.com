import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { sessionFromOAuthCallbackUrl } from '@/features/auth/oauthCallbackUrl';
import { completeOAuthFarmerSession } from '@/features/auth/completeOAuthFarmerSession';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';

/**
 * Deep-link target for OAuth (tracebudoffline:// or exp://…/auth/callback).
 * Usually handled in-app by WebBrowser; this route covers cold-start returns.
 */
export default function AuthCallbackScreen() {
  const { t } = useLanguage();
  const { farmer, plots } = useAppState();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // expo-router provides the full URL via linking — use last linking url if needed
        const { getInitialURL } = await import('expo-linking');
        const url = await getInitialURL();
        if (!url || cancelled) {
          router.replace('/(tabs)');
          return;
        }
        const session = await sessionFromOAuthCallbackUrl(url);
        const result = await completeOAuthFarmerSession({
          session,
          farmerId: farmer?.id,
          localPlots: plots,
        });
        if (!cancelled && !result.ok) {
          console.warn('[auth/callback]', result.message);
        }
      } catch (e) {
        console.warn('[auth/callback]', e);
      }
      if (!cancelled) {
        router.replace('/(tabs)/settings');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmer?.id, plots]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <ActivityIndicator size="large" />
      <ThemedText type="default" style={{ marginTop: 16, textAlign: 'center' }}>
        {t('sign_in_oauth_busy')}
      </ThemedText>
    </View>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Colors, Spacing } from '@/constants/theme';
import { sessionFromOAuthCallbackUrl } from '@/features/auth/oauthCallbackUrl';
import { completeOAuthFarmerSession } from '@/features/auth/completeOAuthFarmerSession';
import { formatSignInErrorMessage } from '@/features/auth/mapAuthError';
import { normalizeAuthAnalyticsReason } from '@/features/auth/authAnalyticsReason';
import { deliverOAuthCallbackUrl } from '@/features/auth/oauthCallbackBridge';
import {
  hasSyncAuthSession,
  hydrateSyncAuthFromSettings,
} from '@/features/api/syncAuthSession';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';

type CallbackPhase = 'loading' | 'error' | 'success';

/**
 * Deep-link target for OAuth (tracebudoffline:// or exp://…/auth/callback).
 * Usually handled in-app by WebBrowser; this route covers cold-start returns.
 */
export default function AuthCallbackScreen() {
  const { t } = useLanguage();
  const { farmer, plots } = useAppState();
  const [phase, setPhase] = useState<CallbackPhase>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const runIdRef = useRef(0);

  const finishSuccess = useCallback(() => {
    setPhase('success');
    trackEvent(ANALYTICS_EVENTS.OAUTH_CALLBACK_SUCCESS, { source: 'cold_start' });
    trackEvent(ANALYTICS_EVENTS.SIGN_IN_SUCCESS, { method: 'oauth', source: 'cold_start' });
    router.replace('/(tabs)/settings');
    setTimeout(() => {
      router.replace('/(tabs)/settings');
    }, 400);
  }, []);

  const runCallback = useCallback(async () => {
    const runId = ++runIdRef.current;
    setPhase('loading');
    setErrorMessage(null);
    trackEvent(ANALYTICS_EVENTS.OAUTH_CALLBACK_STARTED, { source: 'cold_start' });

    try {
      const { getInitialURL } = await import('expo-linking');
      const url = await getInitialURL();
      if (runId !== runIdRef.current) return;

      if (!url) {
        const message = t('auth_callback_missing_url');
        setErrorMessage(message);
        setPhase('error');
        trackEvent(ANALYTICS_EVENTS.OAUTH_CALLBACK_FAILURE, {
          source: 'cold_start',
          reason: 'missing_initial_url',
        });
        trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
          method: 'oauth',
          source: 'cold_start',
          reason: 'missing_initial_url',
        });
        return;
      }

      if (deliverOAuthCallbackUrl(url)) {
        router.replace('/(tabs)/settings');
        return;
      }

      await hydrateSyncAuthFromSettings();
      if (hasSyncAuthSession()) {
        finishSuccess();
        return;
      }

      const session = await sessionFromOAuthCallbackUrl(url);
      if (runId !== runIdRef.current) return;

      const result = await completeOAuthFarmerSession({
        session,
        farmerId: farmer?.id,
        localPlots: plots,
      });
      if (runId !== runIdRef.current) return;

      if (!result.ok) {
        const message = formatSignInErrorMessage(t, result.message);
        setErrorMessage(message);
        setPhase('error');
        trackEvent(ANALYTICS_EVENTS.OAUTH_CALLBACK_FAILURE, {
          source: 'cold_start',
          reason: normalizeAuthAnalyticsReason(result.message),
        });
        trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
          method: 'oauth',
          source: 'cold_start',
          reason: normalizeAuthAnalyticsReason(result.message),
        });
        return;
      }

      finishSuccess();
    } catch (e) {
      if (runId !== runIdRef.current) return;
      const raw = e instanceof Error ? e.message : String(e);
      const message = formatSignInErrorMessage(t, raw);
      setErrorMessage(message);
      setPhase('error');
      trackEvent(ANALYTICS_EVENTS.OAUTH_CALLBACK_FAILURE, {
        source: 'cold_start',
        reason: 'exception',
      });
      trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
        method: 'oauth',
        source: 'cold_start',
        reason: 'exception',
      });
    }
  }, [farmer?.id, finishSuccess, plots, t]);

  useEffect(() => {
    void runCallback();
    return () => {
      runIdRef.current += 1;
    };
  }, [runCallback]);

  if (phase === 'error') {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: Spacing.lg,
          gap: Spacing.md,
        }}
      >
        <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
          {t('auth_callback_error_title')}
        </ThemedText>
        <ThemedText type="default" style={{ textAlign: 'center', color: Colors.light.textMuted }}>
          {errorMessage ?? t('sign_in_oauth_failed')}
        </ThemedText>
        <Button onPress={() => void runCallback()}>{t('auth_callback_retry')}</Button>
        <Pressable onPress={() => router.replace('/(tabs)/settings')} accessibilityRole="button">
          <ThemedText type="link">{t('auth_callback_open_settings')}</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <ActivityIndicator size="large" />
      <ThemedText type="default" style={{ marginTop: 16, textAlign: 'center' }}>
        {phase === 'success' ? t('auth_callback_success') : t('sign_in_oauth_busy')}
      </ThemedText>
    </View>
  );
}

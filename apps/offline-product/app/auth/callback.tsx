import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Colors, Spacing } from '@/constants/theme';
import {
  hasSyncAuthSession,
  hydrateSyncAuthFromSettings,
} from '@/features/api/syncAuthSession';
import { formatSignInErrorMessage } from '@/features/auth/mapAuthError';
import {
  OAUTH_CALLBACK_INTERMEDIARY_TIMEOUT_MS,
  type OAuthColdStartLaunchKind,
  planOAuthColdStartLaunch,
  probeOAuthColdStartLaunchKind,
  shouldExitOAuthIntermediaryScreen,
} from '@/features/auth/oauthColdStartLaunch';
import { runOAuthColdStartCallback, isOAuthProviderSignInInFlight } from '@/features/auth/oauthOrchestrator';
import { isOAuthCallbackUrl } from '@/features/auth/oauthCallbackUrl';
import {
  deliverOAuthDeepLink,
  hasActiveOAuthCallbackWaiter,
} from '@/features/auth/oauthCallbackWaiter';
import { resolveOAuthColdStartUrlForLaunch } from '@/features/auth/resolveOAuthColdStartUrl';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';

type CallbackPhase = 'loading' | 'error' | 'success';

/**
 * Deep-link target for OAuth (tracebudoffline:// or exp://…/auth/callback).
 * Cold-start returns are handled here; warm-app callbacks go through oauthOrchestrator.
 */
export default function AuthCallbackScreen() {
  const { t } = useLanguage();
  const { farmer, plots, isAppReady } = useAppState();
  const [launchKind, setLaunchKind] = useState<OAuthColdStartLaunchKind>('probing');
  const [phase, setPhase] = useState<CallbackPhase>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const runIdRef = useRef(0);
  const phaseRef = useRef<CallbackPhase>('loading');
  const farmerIdRef = useRef(farmer?.id);
  const plotsRef = useRef(plots);

  farmerIdRef.current = farmer?.id;
  plotsRef.current = plots;
  phaseRef.current = phase;

  const exitToHome = useCallback((reason: string) => {
    trackEvent(ANALYTICS_EVENTS.OAUTH_CALLBACK_SUCCESS, { source: 'cold_start', reason });
    router.replace('/(tabs)');
  }, []);

  useLayoutEffect(() => {
    let cancelled = false;
    void probeOAuthColdStartLaunchKind().then((kind) => {
      if (cancelled) return;
      setLaunchKind(kind);
      if (kind === 'stale_restored_route') {
        exitToHome('stale_callback_route_immediate');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [exitToHome]);

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
      await hydrateSyncAuthFromSettings();
      if (hasSyncAuthSession()) {
        exitToHome('already_signed_in');
        return;
      }

      const initialPeek = await Linking.getInitialURL();

      if (hasActiveOAuthCallbackWaiter() || isOAuthProviderSignInInFlight()) {
        if (initialPeek && isOAuthCallbackUrl(initialPeek)) {
          deliverOAuthDeepLink(initialPeek);
        }
        exitToHome('browser_waiter_active');
        return;
      }

      if (isOAuthCallbackUrl(initialPeek)) {
        for (const delayMs of [200, 400, 800, 1600, 3200]) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          await hydrateSyncAuthFromSettings();
          if (hasSyncAuthSession()) {
            exitToHome('browser_flow_completed');
            return;
          }
          if (hasActiveOAuthCallbackWaiter() || isOAuthProviderSignInInFlight()) {
            if (initialPeek) {
              deliverOAuthDeepLink(initialPeek);
            }
            exitToHome('browser_waiter_active');
            return;
          }
        }
      }

      const url = await resolveOAuthColdStartUrlForLaunch(initialPeek);
      if (runId !== runIdRef.current) return;

      if (!url && !isOAuthCallbackUrl(initialPeek)) {
        exitToHome('stale_callback_route');
        return;
      }

      const outcome = await runOAuthColdStartCallback({
        url,
        farmerId: farmerIdRef.current,
        localPlots: plotsRef.current,
      });
      if (runId !== runIdRef.current) return;

      if (outcome.status === 'exit_to_home') {
        exitToHome(outcome.reason);
        return;
      }

      if (outcome.status === 'delivered_to_waiter') {
        exitToHome('delivered_to_waiter');
        return;
      }

      if (shouldExitOAuthIntermediaryScreen(outcome)) {
        finishSuccess();
        return;
      }

      const message = formatSignInErrorMessage(t, outcome.message);
      setErrorMessage(message);
      setPhase('error');
      trackEvent(ANALYTICS_EVENTS.OAUTH_CALLBACK_FAILURE, {
        source: 'cold_start',
        reason: outcome.message,
      });
      trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
        method: 'oauth',
        source: 'cold_start',
        reason: outcome.message,
      });
    } catch (e) {
      if (runId !== runIdRef.current) return;
      const raw = e instanceof Error ? e.message : String(e);
      const message = formatSignInErrorMessage(t, raw);
      setErrorMessage(message);
      setPhase('error');
      trackEvent(ANALYTICS_EVENTS.OAUTH_CALLBACK_FAILURE, {
        source: 'cold_start',
        reason: 'exception',
        message: raw,
      });
      trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
        method: 'oauth',
        source: 'cold_start',
        reason: 'exception',
        message: raw,
      });
    }
  }, [exitToHome, finishSuccess, t]);

  useEffect(() => {
    if (launchKind !== 'oauth_return') return;
    if (planOAuthColdStartLaunch({ isAppReady }).action === 'wait_for_bootstrap') {
      return;
    }
    void runCallback();
    return () => {
      runIdRef.current += 1;
    };
  }, [isAppReady, launchKind, runCallback]);

  useEffect(() => {
    if (launchKind !== 'oauth_return' || !isAppReady || phase !== 'loading') return;

    const timer = setTimeout(() => {
      if (phaseRef.current !== 'loading') return;
      trackEvent(ANALYTICS_EVENTS.OAUTH_CALLBACK_FAILURE, {
        source: 'cold_start',
        reason: 'intermediary_timeout',
      });
      exitToHome('intermediary_timeout');
    }, OAUTH_CALLBACK_INTERMEDIARY_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [exitToHome, isAppReady, launchKind, phase]);

  if (launchKind === 'probing' || launchKind === 'stale_restored_route') {
    return null;
  }

  if (phase === 'error') {
    return (
      <View
        testID="auth-callback-error"
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: Spacing.lg,
          gap: Spacing.md,
        }}
      >
        <ThemedText
          testID="auth-callback-error-title"
          type="subtitle"
          style={{ textAlign: 'center' }}
        >
          {t('auth_callback_error_title')}
        </ThemedText>
        <ThemedText type="default" style={{ textAlign: 'center', color: Colors.light.textMuted }}>
          {errorMessage ?? t('sign_in_oauth_failed')}
        </ThemedText>
        <Button onPress={() => void runCallback()}>{t('auth_callback_retry')}</Button>
        <Pressable onPress={() => router.replace('/(tabs)')} accessibilityRole="button">
          <ThemedText type="link">{t('auth_callback_open_settings')}</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      testID="auth-callback-loading"
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <ActivityIndicator size="large" />
      <ThemedText type="default" style={{ marginTop: 16, textAlign: 'center' }}>
        {phase === 'success' ? t('auth_callback_success') : t('sign_in_oauth_busy')}
      </ThemedText>
    </View>
  );
}

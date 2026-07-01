import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { FarmerActivityRow } from '@/components/activity/FarmerActivityRow';
import { StackGradientHeader } from '@/components/layout/StackGradientHeader';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  formatActivityLastUpdated,
  loadFarmerActivityCache,
} from '@/features/activity/farmerActivityCache';
import { navigateFromActivityTarget } from '@/features/activity/navigateFromActivityTarget';
import { refreshFarmerActivityFeed } from '@/features/activity/refreshFarmerActivityFeed';
import type { FarmerActivityFeedSnapshot } from '@/features/activity/farmerActivityTypes';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import { goBackOrHome } from '@/features/navigation/routes';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { createActivityScreenStyles } from '@/screenStyles/activityScreenStyles';

export default function ActivityScreen() {
  const styles = useThemedStyles(createActivityScreenStyles);
  const { farmer, plots } = useAppState();
  const { t, lang, openLanguagePicker } = useLanguage();
  const { isSignedIn, openSignIn } = useSignInSheet();
  const [snapshot, setSnapshot] = useState<FarmerActivityFeedSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOfflineHint, setShowOfflineHint] = useState(false);

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.ACTIVITY_FEED_VIEWED, { signedIn: isSignedIn });
  }, [isSignedIn]);

  const reload = useCallback(
    async (options?: { forcePlotFetch?: boolean }) => {
      setLoading(true);
      const cached = await loadFarmerActivityCache().catch(() => null);
      if (cached) {
        setSnapshot(cached);
      }

      try {
        const result = await refreshFarmerActivityFeed({
          farmer: farmer ?? null,
          plots,
          isSignedIn,
          t,
          forcePlotFetch: options?.forcePlotFetch,
        });
        setSnapshot(result.snapshot);
        setShowOfflineHint(!result.fromNetwork && cached != null);
      } catch {
        setShowOfflineHint(Boolean(cached));
      } finally {
        setLoading(false);
      }
    },
    [farmer, plots, isSignedIn, t],
  );

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const lastUpdatedLabel =
    snapshot?.fetchedAt != null
      ? t('activity_last_updated', {
          when: formatActivityLastUpdated(snapshot.fetchedAt, lang),
        })
      : null;

  return (
    <ThemedView style={styles.screen} testID="activity-screen">
      <StackGradientHeader
        title={t('activity_title')}
        onBack={() => goBackOrHome(router)}
        backLabel={t('back')}
        langLabel={String(lang).toUpperCase()}
        onLangPress={openLanguagePicker}
        langAccessibilityLabel={t('language_picker_title')}
      />

      <ThemedScrollView contentContainerStyle={styles.container}>
        {!isSignedIn ? (
          <View style={styles.signInBanner}>
            <Ionicons name="lock-closed-outline" size={22} color="#64748B" />
            <View style={styles.signInBannerText}>
              <ThemedText type="defaultSemiBold" style={styles.signInBannerTitle}>
                {t('activity_sign_in_title')}
              </ThemedText>
              <ThemedText type="caption" style={styles.signInBannerSub}>
                {t('activity_sign_in_body')}
              </ThemedText>
            </View>
            <Button size="sm" onPress={() => openSignIn({ variant: 'general' })}>
              {t('sign_in')}
            </Button>
          </View>
        ) : null}

        {lastUpdatedLabel ? (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <ThemedText type="caption" style={styles.metaText}>
              {lastUpdatedLabel}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('activity_refresh')}
              onPress={() => void reload({ forcePlotFetch: true })}
              hitSlop={8}
            >
              <Ionicons name="refresh-outline" size={18} color="#64748B" />
            </Pressable>
          </View>
        ) : null}

        {showOfflineHint ? (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={18} color="#B45309" />
            <ThemedText type="caption" style={styles.offlineBannerText}>
              {t('activity_offline_banner')}
            </ThemedText>
          </View>
        ) : null}

        {loading && !snapshot ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
          </View>
        ) : null}

        {isSignedIn && snapshot && snapshot.items.length === 0 && !loading ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <Ionicons name="notifications-outline" size={28} color="#94A3B8" />
            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
              {t('activity_empty_title')}
            </ThemedText>
            <ThemedText type="caption" style={styles.emptyBody}>
              {t('activity_empty_body')}
            </ThemedText>
          </Card>
        ) : null}

        {snapshot?.items.map((item) => (
          <FarmerActivityRow
            key={item.id}
            item={item}
            onPress={() => {
              trackEvent(ANALYTICS_EVENTS.ACTIVITY_ROW_OPENED, {
                category: item.category,
                severity: item.severity,
              });
              navigateFromActivityTarget(item.navigate);
            }}
          />
        ))}
      </ThemedScrollView>
    </ThemedView>
  );
}

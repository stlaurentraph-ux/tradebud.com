import { Pressable, View } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { CompactTabHeader, HomeHeaderBrandLeft } from '@/components/layout/CompactTabHeader';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { HEADER_GRADIENT_COLORS } from '@/constants/compactTabHeader';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { createHomeScreenStyles } from '@/screenStyles/homeScreenStyles';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  loadPendingSyncActions,
  loadPlotServerLinks,
} from '@/features/state/persistence';
import { fetchServerPlotListForUi } from '@/features/sync/serverPlotListCache';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import { loadAllPlotReadinessStates } from '@/features/compliance/loadPlotReadiness';
import { estimatePlotSyncAttention } from '@/features/sync/plotServerSync';
import { summarizeHomeBackupAttention } from '@/features/sync/homeBackupAttention';
import { readPendingCampaignInviteId } from '@/features/campaign/campaignInviteContext';
import { PendingCampaignInviteBanner } from '@/features/campaign/PendingCampaignInviteBanner';
import { EnumerationHomePanel } from '@/components/enumeration/EnumerationHomePanel';
import { useEnumerationOptional } from '@/features/enumeration/EnumerationContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useThemedStyles(createHomeScreenStyles);
  const { farmer, farmerDisplayName, plots } = useAppState();
  const { languageCode, openLanguagePicker, t } = useLanguage();

  const [pendingCount, setPendingCount] = useState(0);
  const [backendPlots, setBackendPlots] = useState<any[]>([]);
  const [plotServerLinks, setPlotServerLinks] = useState<Record<string, string>>({});
  const [homeReadinessStats, setHomeReadinessStats] = useState<{
    compliant: number;
    pending: number;
  } | null>(null);
  const [actionRequired, setActionRequired] = useState<{ message: string; plotId: string } | null>(null);
  const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(null);
  const campaignBannerTrackedRef = useRef<string | null>(null);
  const readinessRefreshGenRef = useRef(0);
  const plotsRef = useRef(plots);
  plotsRef.current = plots;
  const { openSignIn, openCreateAccount, isSignedIn, refreshAuth } = useSignInSheet();
  const enumeration = useEnumerationOptional();
  const isEnumerationHome = Boolean(enumeration?.isEnumerationMode);

  const refreshPlotReadiness = useCallback(async () => {
    const currentPlots = plotsRef.current;
    if (currentPlots.length === 0) {
      setActionRequired((prev) => (prev === null ? prev : null));
      setHomeReadinessStats((prev) => (prev === null ? prev : null));
      return;
    }
    const gen = ++readinessRefreshGenRef.current;
    const results = await loadAllPlotReadinessStates(currentPlots, backendPlots, farmer);
    if (gen !== readinessRefreshGenRef.current) return;

    const compliant = results.filter((r) => r.done).length;
    const pending = Math.max(0, currentPlots.length - compliant);
    setHomeReadinessStats((prev) =>
      prev?.compliant === compliant && prev?.pending === pending ? prev : { compliant, pending },
    );
    const firstIncomplete = results.find((r) => !r.done);
    if (!firstIncomplete) {
      setActionRequired((prev) => (prev === null ? prev : null));
      return;
    }
    const plot = currentPlots.find((p) => p.id === firstIncomplete.plotId);
    if (!plot) {
      setActionRequired((prev) => (prev === null ? prev : null));
      return;
    }
    const message = !firstIncomplete.checklist.groundOk
      ? t('home_action_plot_photos', { name: plot.name })
      : t('home_action_plot_setup', { name: plot.name });
    setActionRequired((prev) =>
      prev?.message === message && prev?.plotId === plot.id ? prev : { message, plotId: plot.id },
    );
    // plots is read via plotsRef.current; plots.length is kept to recompute when the count changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendPlots, farmer, t, plots.length]);

  const refreshBackendPlots = useCallback(
    async (force = false) => {
      if (!farmer?.id || !isSignedIn) {
        setBackendPlots((prev) => (prev.length === 0 ? prev : []));
        return;
      }
      try {
        const rows = await fetchServerPlotListForUi({
          profileFarmerId: farmer.id,
          localPlots: plotsRef.current,
          force,
        });
        setBackendPlots(rows ?? []);
      } catch {
        setBackendPlots((prev) => (prev.length === 0 ? prev : []));
      }
    },
    [farmer?.id, isSignedIn],
  );

  const refreshBackendPlotsRef = useRef(refreshBackendPlots);
  refreshBackendPlotsRef.current = refreshBackendPlots;

  useFocusEffect(
    useCallback(() => {
      void refreshAuth();
      void readPendingCampaignInviteId()
        .then((campaignId) => setPendingCampaignId(campaignId))
        .catch(() => setPendingCampaignId(null));
      loadPendingSyncActions()
        .then((rows) => setPendingCount(rows.length))
        .catch(() => undefined);
      loadPlotServerLinks()
        .then((links) => setPlotServerLinks(links))
        .catch(() => undefined);
      void refreshBackendPlotsRef.current(false);
    }, [refreshAuth]),
  );

  const plotAttentionEstimate = useMemo(() => {
    if (plots.length === 0) return null;
    return estimatePlotSyncAttention({
      localPlots: plots,
      backendPlots: isSignedIn ? backendPlots : [],
      plotServerLinks,
      t,
    });
  }, [plots, backendPlots, plotServerLinks, isSignedIn, t]);

  const { totalPendingSync, needsBackupAttention, plotsBackedUpOnDevice } = useMemo(
    () =>
      summarizeHomeBackupAttention({
        plotCount: plots.length,
        pendingQueueCount: pendingCount,
        unsyncedPlotCount: plotAttentionEstimate?.needsUploadPlots.length ?? 0,
        blockedPlotCount: plotAttentionEstimate?.blockedPlots.length ?? 0,
      }),
    [plots.length, pendingCount, plotAttentionEstimate],
  );

  const openBackupFlow = useCallback(() => {
    if (!isSignedIn) {
      openSignIn({ variant: 'sync' });
      return;
    }
    router.navigate('/(tabs)/settings?focus=backup');
  }, [isSignedIn, openSignIn]);

  useEffect(() => {
    loadPendingSyncActions()
      .then((rows) => setPendingCount(rows.length))
      .catch(() => undefined);
  }, [plots.length, farmer?.id]);

  useEffect(() => {
    void refreshBackendPlots(false);
  }, [farmer?.id, isSignedIn, plots.length, refreshBackendPlots]);

  useEffect(() => {
    void refreshPlotReadiness();
  }, [refreshPlotReadiness]);

  const plotsCount = plots.length;
  const homeWelcomeName = farmerDisplayName?.trim() || null;

  /** One next-step card until the first plot is saved; then hidden. */
  const onboardingStep = useMemo((): 'register_plot' | 'add_name' | null => {
    if (pendingCampaignId) return null;
    if (plots.length > 0) return null;
    if (farmer && !farmer.name?.trim()) return 'add_name';
    return 'register_plot';
  }, [plots.length, farmer, pendingCampaignId]);

  useEffect(() => {
    if (!pendingCampaignId) return;
    if (campaignBannerTrackedRef.current === pendingCampaignId) return;
    campaignBannerTrackedRef.current = pendingCampaignId;
    trackEvent(ANALYTICS_EVENTS.CAMPAIGN_INVITE_BANNER_SHOWN, { campaignId: pendingCampaignId });
  }, [pendingCampaignId]);

  const homeTiles = useMemo(() => {
    const openPlotSection = (sub: 'documents') => {
      if (sub === 'documents') {
        router.push('/documents');
      }
    };

    const openReceipts = () => {
      router.navigate('/(tabs)/harvests?focus=receipts');
    };

    const all = [
      {
        key: 'register_plot',
        title: t('register_plot_tile'),
        subtitle: t('walk_perimeter_sub'),
        icon: 'location-outline' as const,
        tint: '#BFEEDB',
        iconColor: '#0B7B59',
        onPress: () => router.navigate('/(tabs)/record'),
        showWhenEmpty: true,
      },
      {
        key: 'log_harvest',
        title: t('log_harvest_tile'),
        subtitle: t('record_delivery_sub'),
        icon: 'scale-outline' as const,
        tint: '#F8EDC8',
        iconColor: '#B45A00',
        onPress: () => router.navigate('/(tabs)/harvests?focus=select'),
        showWhenEmpty: true,
      },
      {
        key: 'vouchers',
        title: t('my_vouchers_tile'),
        subtitle: t('compliance_qr_sub'),
        icon: 'qr-code-outline' as const,
        tint: '#F0E3FF',
        iconColor: '#7A1FD1',
        onPress: openReceipts,
        showWhenEmpty: true,
      },
      {
        key: 'documents',
        title: t('documents_tile'),
        subtitle: t('land_permits_sub'),
        icon: 'document-text-outline' as const,
        tint: '#DCE9FF',
        iconColor: '#2454D7',
        onPress: () => openPlotSection('documents'),
        showWhenEmpty: true,
      },
    ];
    if (plots.length === 0) {
      return all.filter((tile) => tile.showWhenEmpty);
    }
    return all;
  }, [t, plots]);

  const homeTileRows = useMemo(() => {
    const rows: (typeof homeTiles)[] = [];
    for (let i = 0; i < homeTiles.length; i += 2) {
      rows.push(homeTiles.slice(i, i + 2));
    }
    return rows;
  }, [homeTiles]);

  return (
    <ThemedView style={styles.screen}>
      <CompactTabHeader
        paddingTop={insets.top}
        left={<HomeHeaderBrandLeft />}
        onLanguagePress={openLanguagePicker}
        languageLabel={languageCode}
        homeBrandLayout
      />

      <ThemedScrollView contentContainerStyle={styles.container}>
        {isEnumerationHome ? (
          <EnumerationHomePanel />
        ) : (
          <>
        {pendingCampaignId ? (
          <PendingCampaignInviteBanner
            campaignId={pendingCampaignId}
            isSignedIn={isSignedIn}
            onDismiss={() => setPendingCampaignId(null)}
            t={t}
          />
        ) : null}

        {onboardingStep ? (
          <Card variant="outlined" style={styles.onboardingCard}>
            <View style={styles.onboardingHeader}>
              <View style={styles.onboardingIconWrap}>
                <Ionicons
                  name={onboardingStep === 'add_name' ? 'person-outline' : 'walk-outline'}
                  size={22}
                  color={Brand.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold">
                  {t(
                    onboardingStep === 'add_name'
                      ? 'onboarding_next_title_name'
                      : 'onboarding_next_title_plot',
                  )}
                </ThemedText>
                <ThemedText type="caption" style={{ marginTop: 6 }}>
                  {t(
                    onboardingStep === 'add_name'
                      ? 'onboarding_next_body_name'
                      : 'onboarding_next_body_plot',
                  )}
                </ThemedText>
              </View>
            </View>
            {onboardingStep === 'register_plot' && !isSignedIn ? (
              <View style={styles.onboardingAccountLinks}>
                <Pressable onPress={() => void openCreateAccount()} hitSlop={8}>
                  <ThemedText type="caption" style={styles.onboardingLink}>
                    {t('create_account')}
                  </ThemedText>
                </Pressable>
                <ThemedText type="caption" style={styles.onboardingLinkSep}>
                  ·
                </ThemedText>
                <Pressable onPress={() => openSignIn({ variant: 'general' })} hitSlop={8}>
                  <ThemedText type="caption" style={styles.onboardingLink}>
                    {t('already_have_account')}
                  </ThemedText>
                </Pressable>
              </View>
            ) : null}
            <Pressable
              onPress={() =>
                onboardingStep === 'add_name'
                  ? router.navigate('/(tabs)/settings')
                  : router.navigate('/(tabs)/record')
              }
              style={({ pressed }) => [
                styles.onboardingCta,
                pressed && { opacity: 0.9 },
              ]}
            >
              <ThemedText type="defaultSemiBold" style={styles.onboardingCtaText}>
                {t(
                  onboardingStep === 'add_name'
                    ? 'onboarding_next_cta_name'
                    : 'onboarding_next_cta_plot',
                )}
              </ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </Card>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('why_tracebud_home_link')}
          onPress={() => {
            trackEvent(ANALYTICS_EVENTS.WHY_TRACEBUD_HOME_TEASER_CLICKED, { source: 'home' });
            router.push({ pathname: '/why-tracebud', params: { source: 'home' } });
          }}
          style={({ pressed }) => [
            styles.whyTracebudTeaser,
            pressed && styles.whyTracebudTeaserPressed,
          ]}
        >
          <View style={styles.whyTracebudTeaserIcon}>
            <Ionicons name="leaf-outline" size={18} color={Brand.primary} />
          </View>
          <View style={styles.whyTracebudTeaserText}>
            <ThemedText type="defaultSemiBold" style={styles.whyTracebudTeaserLink}>
              {t('why_tracebud_home_link')}
            </ThemedText>
            <ThemedText type="caption" style={styles.whyTracebudTeaserHint}>
              {t('why_tracebud_home_teaser')}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.link} />
        </Pressable>

        <LinearGradient
          colors={[...HEADER_GRADIENT_COLORS]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeCard}
        >
          {homeWelcomeName ? (
            <>
              <ThemedText type="caption" style={styles.welcomeBack}>
                {t('welcome_back')}
              </ThemedText>
              <ThemedText type="title" style={styles.welcomeName}>
                {homeWelcomeName}
              </ThemedText>
            </>
          ) : (
            <ThemedText type="title" style={styles.welcomeName}>
              {t('home_welcome_hello')}
            </ThemedText>
          )}
          {plotsCount > 0 ? (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <ThemedText type="caption" style={styles.statLabel}>
                {t('plots_stat')}
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {plotsCount}
              </ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText type="caption" style={styles.statLabel}>
                {t('compliant_stat')}
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {homeReadinessStats ? homeReadinessStats.compliant : '\u00a0'}
              </ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText type="caption" style={styles.statLabel}>
                {t('pending_stat')}
              </ThemedText>
              <ThemedText
                type="defaultSemiBold"
                style={[
                  styles.statValue,
                  (homeReadinessStats?.pending ?? 0) > 0 && styles.statValuePending,
                ]}
              >
                {homeReadinessStats ? homeReadinessStats.pending : '\u00a0'}
              </ThemedText>
            </View>
          </View>
          ) : (
            <ThemedText type="caption" style={styles.welcomeNewUserHint}>
              {t('home_data_on_device')}
            </ThemedText>
          )}
        </LinearGradient>

        <View style={styles.tilesSection}>
          {homeTileRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tilesRow}>
              {row.map((tile) => (
                <HomeTile
                  key={tile.key}
                  testID={`home-tile-${tile.key.replace(/_/g, '-')}`}
                  title={tile.title}
                  subtitle={tile.subtitle}
                  icon={tile.icon}
                  tint={tile.tint}
                  iconColor={tile.iconColor}
                  onPress={tile.onPress}
                />
              ))}
            </View>
          ))}
        </View>

        {actionRequired ? (
          <Card variant="outlined" style={styles.actionRequired}>
            <View style={styles.actionHeader}>
              <Ionicons name="warning-outline" size={22} color="#D97706" />
              <ThemedText type="defaultSemiBold" style={styles.actionTitle}>
                {t('action_required')}
              </ThemedText>
            </View>
            <ThemedText type="default" style={styles.actionBody}>
              {actionRequired.message}
            </ThemedText>
            <Pressable
              onPress={() =>
                router.navigate(
                  `/plot/${encodeURIComponent(actionRequired.plotId)}?sub=photos`,
                )
              }
              style={styles.completeNowRow}
            >
              <ThemedText type="defaultSemiBold" style={styles.completeNowText}>
                {t('complete_now')}
              </ThemedText>
              <Ionicons name="chevron-forward" size={20} color="#B45309" />
            </Pressable>
          </Card>
        ) : null}

        {plotsCount > 0 ? (
        <Pressable
          testID="home-backup-sync-card"
          onPress={openBackupFlow}
          accessibilityRole="button"
          accessibilityLabel={
            isSignedIn
              ? needsBackupAttention
                ? t('home_backup_tap')
                : t('sync_status_section')
              : t('sign_in_to_backup_title')
          }
          style={({ pressed }) => [pressed && styles.syncCardPressed]}
        >
          <Card variant="outlined" style={styles.syncCard}>
            <View style={styles.syncHeader}>
              <View style={styles.syncTitleRow}>
                <Ionicons
                  name={needsBackupAttention ? 'cloud-upload-outline' : 'cloud-done-outline'}
                  size={16}
                  color={needsBackupAttention ? Brand.warning : plotsBackedUpOnDevice || isSignedIn ? Brand.success : Brand.primary}
                />
                <ThemedText type="defaultSemiBold">{t('sync_status')}</ThemedText>
              </View>
              <View style={styles.syncHeaderTrailing}>
                {needsBackupAttention ? (
                  <View
                    style={[
                      styles.pendingPill,
                      { backgroundColor: 'rgba(221,107,32,0.14)' },
                    ]}
                  >
                    <ThemedText type="caption" style={styles.pendingPillText}>
                      {t('backup_pill_pending')}
                    </ThemedText>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </View>
            </View>
            {!needsBackupAttention && isSignedIn ? (
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressFill, styles.progressFillComplete]} />
              </View>
            ) : null}
            <ThemedText
              testID="home-backup-status-caption"
              type="caption"
              style={[
                styles.syncCaption,
                needsBackupAttention
                  ? styles.syncCaptionPending
                  : isSignedIn
                    ? styles.syncCaptionComplete
                    : styles.syncCaptionOptional,
              ]}
            >
              {needsBackupAttention
                ? t('backup_waiting', { n: totalPendingSync })
                : plotsBackedUpOnDevice || isSignedIn
                  ? t('backup_up_to_date')
                  : t('home_sign_in_backup_caption')}
            </ThemedText>
          </Card>
        </Pressable>
        ) : null}
          </>
        )}
      </ThemedScrollView>
    </ThemedView>
  );
}

function HomeTile(props: {
  testID: string;
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  tint: string;
  iconColor: string;
  highlighted?: boolean;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useThemedStyles(createHomeScreenStyles);

  return (
    <Pressable
      testID={props.testID}
      onPress={props.onPress}
      style={({ pressed }) => [styles.tileWrapper, pressed && styles.tilePressed]}
    >
      <Card
        variant="outlined"
        padding="none"
        style={[
          styles.tileCard,
          props.highlighted && styles.tileCardHighlighted,
        ]}
      >
        <View style={styles.tileContent}>
          <View style={[styles.tileIcon, { backgroundColor: props.tint }]}>
            <Ionicons name={props.icon} size={22} color={props.iconColor} />
          </View>
          <ThemedText style={styles.tileTitle}>{props.title}</ThemedText>
          <ThemedText style={[styles.tileSubtitle, { color: colors.textSecondary }]}>
            {props.subtitle}
          </ThemedText>
        </View>
      </Card>
    </Pressable>
  );
}

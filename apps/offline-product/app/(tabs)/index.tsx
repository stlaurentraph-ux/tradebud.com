import { Pressable, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
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
import { Brand, Colors, Radius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  loadPendingSyncActions,
  loadPlotServerLinks,
} from '@/features/state/persistence';
import { fetchPlotsForFarmer } from '@/features/api/postPlot';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import { loadAllPlotReadinessStates } from '@/features/compliance/loadPlotReadiness';
import { listUnsyncedLocalPlots } from '@/features/sync/plotServerSync';
import { scaleText } from '@/features/demo/storeUiScale';

const HOME_SCREEN_PAD = 16;
const HOME_TILE_GAP = 12;
/** Home tile layout contract — keep ≥16px padding, flexible height, wrapping text (see device-qa-preflight). */
const HOME_TILE_PAD_MIN = 16;
const HOME_TILE_ICON_SIZE = 40;
const HOME_TILE_ICON_GAP = 12;
const HOME_TILE_TEXT_GAP = 6;
const HOME_TILE_TITLE_LINE_HEIGHT = scaleText(20);
const HOME_TILE_SUBTITLE_LINE_HEIGHT = scaleText(18);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { farmer, plots } = useAppState();
  const { languageCode, openLanguagePicker, t } = useLanguage();

  const [pendingCount, setPendingCount] = useState(0);
  const [backendPlots, setBackendPlots] = useState<any[]>([]);
  const [plotServerLinks, setPlotServerLinks] = useState<Record<string, string>>({});
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [plotChecklistDoneById, setPlotChecklistDoneById] = useState<Record<string, boolean>>({});
  const [actionRequired, setActionRequired] = useState<{ message: string; plotId: string } | null>(null);
  const { openSignIn, openCreateAccount, isSignedIn, refreshAuth } = useSignInSheet();

  const refreshPlotReadiness = useCallback(async () => {
    if (plots.length === 0) {
      setPlotChecklistDoneById({});
      setActionRequired(null);
      return;
    }
    const results = await loadAllPlotReadinessStates(plots, backendPlots, farmer);
    setPlotChecklistDoneById(Object.fromEntries(results.map((r) => [r.plotId, r.done])));
    const firstIncomplete = results.find((r) => !r.done);
    if (!firstIncomplete) {
      setActionRequired(null);
      return;
    }
    const plot = plots.find((p) => p.id === firstIncomplete.plotId);
    if (!plot) {
      setActionRequired(null);
      return;
    }
    const message = !firstIncomplete.checklist.groundOk
      ? t('home_action_plot_photos', { name: plot.name })
      : t('home_action_plot_setup', { name: plot.name });
    setActionRequired({ message, plotId: plot.id });
  }, [plots, backendPlots, t]);

  useFocusEffect(
    useCallback(() => {
      void refreshAuth();
      loadPendingSyncActions()
        .then((rows) => setPendingCount(rows.length))
        .catch(() => undefined);
      loadPlotServerLinks()
        .then((links) => setPlotServerLinks(links))
        .catch(() => undefined);
      if (farmer?.id && isSignedIn) {
        fetchPlotsForFarmer(farmer.id)
          .then((rows) => setBackendPlots(rows ?? []))
          .catch(() => setBackendPlots([]));
      }
      void refreshPlotReadiness();
    }, [refreshAuth, farmer?.id, isSignedIn, refreshPlotReadiness]),
  );

  const unsyncedPlotCount = useMemo(() => {
    if (!isSignedIn || plots.length === 0) return 0;
    return listUnsyncedLocalPlots(plots, backendPlots, plotServerLinks).length;
  }, [plots, backendPlots, plotServerLinks, isSignedIn]);

  const totalPendingSync = pendingCount + unsyncedPlotCount;
  const needsBackupAttention = isSignedIn && totalPendingSync > 0;

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
    if (!farmer || !isSignedIn) {
      setBackendPlots([]);
      setLoadingBackend(false);
      return;
    }
    setLoadingBackend(true);
    fetchPlotsForFarmer(farmer.id)
      .then((rows) => setBackendPlots(rows ?? []))
      .catch(() => setBackendPlots([]))
      .finally(() => setLoadingBackend(false));
  }, [farmer, isSignedIn, t]);

  useEffect(() => {
    void refreshPlotReadiness();
  }, [refreshPlotReadiness]);

  const counts = useMemo(() => {
    const plotsCount = plots.length;
    const compliant = plots.filter((p) => plotChecklistDoneById[p.id] === true).length;
    const pending = Math.max(0, plotsCount - compliant);
    return { plotsCount, compliant, pending };
  }, [plots, plotChecklistDoneById]);

  /** One next-step card until the first plot is saved; then hidden. */
  const onboardingStep = useMemo((): 'register_plot' | 'add_name' | null => {
    if (plots.length > 0) return null;
    if (farmer && !farmer.name?.trim()) return 'add_name';
    return 'register_plot';
  }, [plots.length, farmer]);
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
        key: 'documents',
        title: t('documents_tile'),
        subtitle: t('land_permits_sub'),
        icon: 'document-text-outline' as const,
        tint: '#DCE9FF',
        iconColor: '#2454D7',
        onPress: () => openPlotSection('documents'),
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
        showWhenEmpty: false,
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
        textInverseColor={colors.textInverse}
        homeBrandLayout
      />

      <ThemedScrollView contentContainerStyle={styles.container}>
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
        <LinearGradient
          colors={[...HEADER_GRADIENT_COLORS]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeCard}
        >
          <ThemedText type="caption" style={styles.welcomeBack}>
            {t('welcome_back')}
          </ThemedText>
          <ThemedText type="title" style={styles.welcomeName}>
            {farmer?.name || t('farmer_fallback')}
          </ThemedText>
          {counts.plotsCount > 0 ? (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <ThemedText type="caption" style={styles.statLabel}>
                {t('plots_stat')}
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {counts.plotsCount}
              </ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText type="caption" style={styles.statLabel}>
                {t('compliant_stat')}
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {loadingBackend ? '…' : counts.compliant}
              </ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText type="caption" style={styles.statLabel}>
                {t('pending_stat')}
              </ThemedText>
              <ThemedText
                type="defaultSemiBold"
                style={[styles.statValue, counts.pending > 0 && styles.statValuePending]}
              >
                {loadingBackend ? '…' : counts.pending}
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

        {counts.plotsCount > 0 ? (
        <Pressable
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
                  color={needsBackupAttention ? Brand.warning : isSignedIn ? Brand.success : Brand.primary}
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
                    <ThemedText type="caption" style={{ color: Brand.warning }}>
                      {t('pending_count', { n: totalPendingSync })}
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
                : isSignedIn
                  ? t('backup_up_to_date')
                  : t('home_sign_in_backup_caption')}
            </ThemedText>
          </Card>
        </Pressable>
        ) : null}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F5F3',
  },
  container: {
    padding: HOME_SCREEN_PAD,
    paddingBottom: 48,
    gap: 16,
    backgroundColor: '#F4F5F3',
  },
  welcomeCard: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  welcomeBack: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: scaleText(14),
    lineHeight: scaleText(18),
  },
  welcomeName: {
    color: '#FFFFFF',
    fontSize: scaleText(28),
    lineHeight: scaleText(34),
    fontWeight: '700',
    marginTop: 2,
  },
  welcomeNewUserHint: {
    marginTop: 14,
    color: 'rgba(255,255,255,0.9)',
    fontSize: scaleText(14),
    lineHeight: scaleText(20),
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.24)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 68,
    justifyContent: 'space-between',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: scaleText(11),
    lineHeight: scaleText(14),
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: scaleText(20),
    lineHeight: scaleText(24),
    marginTop: 6,
  },
  statValuePending: {
    color: '#FFE08A',
  },
  tilesSection: {
    gap: HOME_TILE_GAP,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: HOME_TILE_GAP,
    alignItems: 'stretch',
  },
  tileWrapper: {
    flex: 1,
    alignSelf: 'stretch',
  },
  tileCard: {
    flex: 1,
    paddingHorizontal: HOME_TILE_PAD_MIN,
    paddingVertical: HOME_TILE_PAD_MIN,
    borderRadius: 18,
    borderColor: '#C5CCD3',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
  },
  tileContent: {
    width: '100%',
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  tileTitle: {
    width: '100%',
    fontSize: scaleText(15),
    lineHeight: HOME_TILE_TITLE_LINE_HEIGHT,
    fontWeight: '600',
    color: '#0F172A',
    flexShrink: 1,
  },
  tileSubtitle: {
    width: '100%',
    fontSize: scaleText(13),
    lineHeight: HOME_TILE_SUBTITLE_LINE_HEIGHT,
    fontWeight: '400',
    marginTop: HOME_TILE_TEXT_GAP,
    flexShrink: 1,
  },
  tileCardHighlighted: {
    borderColor: '#5ED6AB',
    borderWidth: 1.8,
    backgroundColor: '#F7FFFB',
  },
  tilePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  tileIcon: {
    width: HOME_TILE_ICON_SIZE,
    height: HOME_TILE_ICON_SIZE,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: HOME_TILE_ICON_GAP,
  },
  actionRequired: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#F7F3E6',
    borderColor: '#F2C94C',
    borderWidth: 1.4,
    gap: 8,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  actionTitle: {
    color: '#7C2D12',
    fontSize: 15,
    lineHeight: 22,
  },
  actionBody: {
    color: '#C05600',
    fontSize: 13,
    lineHeight: 20,
    marginLeft: 32,
  },
  completeNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    paddingTop: 2,
    marginLeft: 32,
  },
  completeNowText: {
    color: '#B45309',
    fontSize: 13,
    lineHeight: 20,
  },
  syncCard: {
    padding: 14,
    borderRadius: 18,
    gap: 8,
  },
  syncCardPressed: {
    opacity: 0.92,
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  syncHeaderTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  syncTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: 'rgba(56,161,105,0.18)',
  },
  progressFill: {
    height: 8,
    borderRadius: Radius.full,
  },
  progressFillComplete: {
    width: '100%',
    backgroundColor: Brand.success,
  },
  syncCaption: {
    marginTop: 2,
  },
  syncCaptionComplete: {
    color: '#2F6B4F',
  },
  syncCaptionPending: {
    color: '#B45309',
  },
  syncCaptionOptional: {
    color: '#4B6B5F',
  },
  onboardingCard: {
    borderRadius: 18,
    padding: 14,
    borderColor: '#AEE6D3',
    backgroundColor: '#F4FBF8',
    gap: 12,
  },
  onboardingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  onboardingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: '#DDEFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingAccountLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  onboardingLink: {
    color: Brand.primary,
    textDecorationLine: 'underline',
  },
  onboardingLinkSep: {
    color: '#9CA3AF',
  },
  onboardingCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    backgroundColor: Brand.primary,
  },
  onboardingCtaText: {
    color: '#FFFFFF',
  },
});

import { Pressable, StyleSheet, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { CompactTabHeader, HomeHeaderBrandLeft } from '@/components/layout/CompactTabHeader';
import { ThemedView } from '@/components/themed-view';
import { ThemedScrollView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brand, Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  loadEvidenceForPlot,
  loadPendingSyncActions,
  loadPhotosForPlot,
  loadTitlePhotosForPlot,
} from '@/features/state/persistence';
import { fetchPlotsForFarmer } from '@/features/api/postPlot';

function findBackendPlotForLocal(
  localPlot: { name?: string; areaHectares: number; kind: 'point' | 'polygon' },
  backendRows: unknown[],
) {
  const byName = (backendRows as { name?: string }[]).find(
    (p) => String(p?.name ?? '') === String(localPlot.name ?? ''),
  );
  if (byName) return byName as any;
  const targetArea = Number(localPlot.areaHectares);
  const byAreaKind = (backendRows as any[])
    .map((p) => ({
      p,
      area: Number(p?.area_ha ?? NaN),
      kind: String(p?.kind ?? ''),
    }))
    .filter((x) => Number.isFinite(x.area) && x.kind === localPlot.kind)
    .sort((a, b) => Math.abs(a.area - targetArea) - Math.abs(b.area - targetArea))[0]?.p;
  return byAreaKind ?? null;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { farmer, plots } = useAppState();
  const { lang, setLang, t } = useLanguage();

  const [pendingCount, setPendingCount] = useState(0);
  const [backendPlots, setBackendPlots] = useState<any[]>([]);
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [plotChecklistDoneById, setPlotChecklistDoneById] = useState<Record<string, boolean>>({});
  const [actionRequired, setActionRequired] = useState<{ message: string; plotId: string } | null>(null);

  useEffect(() => {
    loadPendingSyncActions()
      .then((rows) => setPendingCount(rows.length))
      .catch(() => undefined);
  }, [plots.length, farmer?.id]);

  useEffect(() => {
    if (!farmer) {
      setBackendPlots([]);
      setBackendError(null);
      return;
    }
    setLoadingBackend(true);
    setBackendError(null);
    fetchPlotsForFarmer(farmer.id)
      .then((rows) => setBackendPlots(rows ?? []))
      .catch((err) => {
        setBackendPlots([]);
        setBackendError(err instanceof Error ? err.message : t('backend_unreachable'));
      })
      .finally(() => setLoadingBackend(false));
  }, [farmer?.id, t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        plots.map(async (p) => {
          const backendMatch = findBackendPlotForLocal(p, backendPlots) as
            | { sinaph_overlap?: boolean; indigenous_overlap?: boolean }
            | null;
          const [photos, titleRows, evidenceRows] = await Promise.all([
            loadPhotosForPlot(p.id).catch(() => []),
            loadTitlePhotosForPlot(p.id).catch(() => []),
            loadEvidenceForPlot(p.id).catch(() => []),
          ]);
          const groundOk = photos.length >= 4;
          const landOk =
            titleRows.length > 0 ||
            evidenceRows.some((e: { kind?: string }) => e.kind === 'tenure_evidence');
          const needsFpic = backendMatch?.indigenous_overlap === true;
          const needsPermit = backendMatch?.sinaph_overlap === true;
          const fpicOk = evidenceRows.some((e: { kind?: string }) => e.kind === 'fpic_repository');
          const permitOk = evidenceRows.some(
            (e: { kind?: string }) => e.kind === 'protected_area_permit',
          );
          const syncOk = Boolean(backendMatch);
          const done =
            groundOk &&
            landOk &&
            (!needsFpic || fpicOk) &&
            (!needsPermit || permitOk) &&
            syncOk;
          return [p.id, done] as const;
        }),
      );
      if (cancelled) return;
      setPlotChecklistDoneById(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [plots, backendPlots]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (plots.length === 0) {
        if (!cancelled) setActionRequired(null);
        return;
      }
      for (const p of plots) {
        const backendMatch = findBackendPlotForLocal(p, backendPlots) as { status?: string } | null;
        // If backend already marks this plot compliant, do not surface local action-needed nudges.
        if (String(backendMatch?.status ?? '') === 'compliant') {
          continue;
        }
        const photos = await loadPhotosForPlot(p.id).catch(() => []);
        if ((photos?.length ?? 0) < 4) {
          if (!cancelled) {
            setActionRequired({
              message: t('home_action_plot_photos', { name: p.name }),
              plotId: p.id,
            });
          }
          return;
        }
      }
      if (!cancelled) setActionRequired(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [plots, backendPlots, t]);

  const counts = useMemo(() => {
    const plotsCount = plots.length;
    const compliant = plots.filter((p) => {
      if (plotChecklistDoneById[p.id] === true) return true;
      const backendMatch = findBackendPlotForLocal(p, backendPlots) as { status?: string } | null;
      return String(backendMatch?.status ?? '') === 'compliant';
    }).length;
    const pending = Math.max(0, plotsCount - compliant);
    return { plotsCount, compliant, pending };
  }, [plots, backendPlots, plotChecklistDoneById]);

  const backendConfigured =
    !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const hasFarmer = !!farmer;
  const hasPlots = plots.length > 0;
  const needsOnboarding = !backendConfigured || !hasFarmer || !hasPlots;
  const isOnline = backendConfigured && !loadingBackend && !backendError;

  return (
    <ThemedView style={styles.screen}>
      <CompactTabHeader
        paddingTop={insets.top}
        badge={
          <Badge variant={isOnline ? 'success' : 'warning'} size="sm">
            {isOnline ? t('online') : t('offline')}
          </Badge>
        }
        left={<HomeHeaderBrandLeft subtitle={t('home_subtitle')} />}
        onLanguagePress={() => setLang(lang === 'en' ? 'es' : 'en')}
        languageLabel={String(lang)}
        textInverseColor={colors.textInverse}
        homeBrandLayout
      />

      <ThemedScrollView contentContainerStyle={styles.container}>
        {needsOnboarding && (
          <Card variant="outlined" style={styles.onboardingCard}>
            <ThemedText type="defaultSemiBold">{t('getting_started_title')}</ThemedText>
            <ThemedText type="caption" style={{ marginTop: 6 }}>
              {t('getting_started_body')}
            </ThemedText>
            <View style={{ marginTop: 10, gap: 6 }}>
              <ThemedText type="caption">
                {backendConfigured ? '✓' : '•'} {t('checklist_backend')}
              </ThemedText>
              <ThemedText type="caption">
                {hasFarmer ? '✓' : '•'} {t('checklist_farmer')}
              </ThemedText>
              <ThemedText type="caption">
                {hasPlots ? '✓' : '•'} {t('checklist_plot')}
              </ThemedText>
            </View>
            <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => router.push('/(tabs)/settings')}
                style={({ pressed }) => [
                  styles.onboardingPill,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Ionicons name="settings-outline" size={16} color={Brand.primary} />
                <ThemedText type="caption" style={{ color: Brand.primary }}>
                  {t('open_settings')}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => router.push('/record')}
                style={({ pressed }) => [
                  styles.onboardingPill,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Ionicons name="walk-outline" size={16} color={Brand.primary} />
                <ThemedText type="caption" style={{ color: Brand.primary }}>
                  {t('record_a_plot')}
                </ThemedText>
              </Pressable>
            </View>
          </Card>
        )}
        <Card variant="outlined" style={styles.welcomeCard}>
          <ThemedText type="caption" style={{ color: '#2C6B57', opacity: 0.95 }}>
            {t('welcome_back')}
          </ThemedText>
          <ThemedText type="title" style={{ color: '#0B4F3B' }}>
            {farmer?.name || t('farmer_fallback')}
          </ThemedText>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, styles.statBoxPlots]}>
              <ThemedText
                type="caption"
                numberOfLines={1}
                style={{ color: '#2C6B57', opacity: 0.95, fontSize: 11, lineHeight: 14 }}
              >
                {t('plots_stat')}
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={{ color: '#0B4F3B', fontSize: 18 }}>
                {counts.plotsCount}
              </ThemedText>
            </View>
            <View style={[styles.statBox, styles.statBoxCompliant]}>
              <ThemedText
                type="caption"
                numberOfLines={1}
                style={{ color: '#2C6B57', opacity: 0.95, fontSize: 11, lineHeight: 14 }}
              >
                {t('compliant_stat')}
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={{ color: '#0B4F3B', fontSize: 18 }}>
                {loadingBackend ? '…' : counts.compliant}
              </ThemedText>
            </View>
            <View style={[styles.statBox, styles.statBoxPending]}>
              <ThemedText
                type="caption"
                numberOfLines={1}
                style={{ color: '#2C6B57', opacity: 0.95, fontSize: 11, lineHeight: 14 }}
              >
                {t('pending_stat')}
              </ThemedText>
              <ThemedText
                type="defaultSemiBold"
                style={{ color: pendingCount > 0 ? '#C47A00' : '#0B4F3B', fontSize: 18 }}
              >
                {loadingBackend ? '…' : counts.pending}
              </ThemedText>
            </View>
          </View>
        </Card>

        <View style={styles.tilesGrid}>
          <HomeTile
            title={t('register_plot_tile')}
            subtitle={t('walk_perimeter_sub')}
            icon="location-outline"
            tint="#BFEEDB"
            iconColor="#0B7B59"
            onPress={() => router.push('/record')}
          />
          <HomeTile
            title={t('log_harvest_tile')}
            subtitle={t('record_delivery_sub')}
            icon="scale-outline"
            tint="#F8EDC8"
            iconColor="#B45A00"
            onPress={() => router.push('/harvests')}
          />
          <HomeTile
            title={t('documents_tile')}
            subtitle={t('land_permits_sub')}
            icon="document-text-outline"
            tint="#DCE9FF"
            iconColor="#2454D7"
            onPress={() => {
              const first = plots[0];
              if (first?.id) {
                router.push(`/plot/${encodeURIComponent(first.id)}?sub=documents`);
                return;
              }
              router.push('/documents');
            }}
          />
          <HomeTile
            title={t('my_vouchers_tile')}
            subtitle={t('compliance_qr_sub')}
            icon="qr-code-outline"
            tint="#F0E3FF"
            iconColor="#7A1FD1"
            onPress={() => {
              const first = plots[0];
              if (first?.id) {
                router.push(`/plot/${encodeURIComponent(first.id)}?sub=voucher`);
                return;
              }
              router.push('/harvests');
            }}
          />
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
                router.push(`/explore?plotId=${encodeURIComponent(actionRequired.plotId)}&focus=photos`)
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

        <Card variant="outlined" style={styles.syncCard}>
          <View style={styles.syncHeader}>
            <View style={styles.syncTitleRow}>
              <Ionicons name="cloud-upload-outline" size={16} color={colors.textSecondary} />
              <ThemedText type="defaultSemiBold">{t('sync_status')}</ThemedText>
            </View>
            <View
              style={[
                styles.pendingPill,
                { backgroundColor: pendingCount > 0 ? 'rgba(221,107,32,0.14)' : 'rgba(56,161,105,0.14)' },
              ]}
            >
              <ThemedText
                type="caption"
                style={{ color: pendingCount > 0 ? Brand.warning : Brand.success }}
              >
                {t('pending_count', { n: pendingCount })}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: pendingCount > 0 ? '35%' : '85%', backgroundColor: Brand.primary },
              ]}
            />
          </View>
          <ThemedText type="caption" style={{ marginTop: 6 }}>
            {pendingCount > 0 ? t('last_sync_pending') : t('last_sync_now')}
          </ThemedText>
        </Card>
      </ThemedScrollView>
    </ThemedView>
  );
}

function HomeTile(props: {
  title: string;
  subtitle: string;
  icon: any;
  tint: string;
  iconColor: string;
  highlighted?: boolean;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.tileWrapper,
        pressed && styles.tilePressed,
      ]}
    >
      <Card
        variant="outlined"
        style={[
          styles.tileCard,
          props.highlighted && styles.tileCardHighlighted,
        ]}
      >
        <View style={[styles.tileIcon, { backgroundColor: props.tint }]}>
          <Ionicons name={props.icon} size={22} color={props.iconColor} />
        </View>
        <ThemedText type="defaultSemiBold" numberOfLines={2} ellipsizeMode="tail">
          {props.title}
        </ThemedText>
        <ThemedText type="caption" numberOfLines={1} ellipsizeMode="tail" style={{ color: colors.textSecondary }}>
          {props.subtitle}
        </ThemedText>
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
    padding: 16,
    paddingBottom: 48,
    gap: 16,
    backgroundColor: '#F4F5F3',
  },
  welcomeCard: {
    borderRadius: 18,
    padding: 20,
    backgroundColor: '#DDEFE8',
    borderColor: '#86DDBE',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: Radius.lg,
    backgroundColor: '#ECF5F1',
    borderWidth: 1,
    borderColor: '#D6E7DF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 72,
  },
  statBoxPlots: {
    flex: 1,
  },
  statBoxCompliant: {
    flex: 1.35,
  },
  statBoxPending: {
    flex: 1.35,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  tileWrapper: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  tileCard: {
    padding: 14,
    borderRadius: 18,
    borderColor: '#CDD2D6',
    borderWidth: 1.4,
    backgroundColor: '#FFFFFF',
    minHeight: 120,
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
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
  progressBar: {
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: Radius.full,
  },
  onboardingCard: {
    borderRadius: 18,
    padding: 12,
  },
  onboardingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#E6F7EF',
  },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppState, type Plot } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { fetchVouchersForFarmer } from '@/features/api/postPlot';
import { fetchServerPlotListForUi } from '@/features/sync/serverPlotListCache';
import { loadAllPlotReadinessStates } from '@/features/compliance/loadPlotReadiness';
import { getPlotUploadGeometryBlock } from '@/features/sync/plotSyncPending';
import { countVouchersForPlot } from '@/features/harvest/voucherPlotCounts';
import { findBackendPlotForLocal } from '@/features/plots/backendPlotMatch';
import { CompactTabHeader, TabHeaderSpacer } from '@/components/layout/CompactTabHeader';
import { PlotListThumbnail } from '@/components/plot-map/PlotListThumbnail';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { createExploreScreenStyles } from '@/app/(tabs)/exploreScreenStyles';

type PlotListTranslate = (key: string, values?: Record<string, string | number>) => string;

function PlotListAreaCaption({ plot, tr }: { plot: Plot; tr: PlotListTranslate }) {
  const styles = useThemedStyles(createExploreScreenStyles);
  const hasGpsArea = plot.areaHectares > 0;
  const dec = plot.declaredAreaHectares;
  const hasDeclared = dec != null && Number.isFinite(dec);
  if (hasGpsArea && hasDeclared) {
    return (
      <ThemedText type="caption" style={styles.areaCaption}>
        {tr('plot_hectares_gps', { n: plot.areaHectares.toFixed(1) })} ·{' '}
        {tr('plot_hectares_declared', { n: dec.toFixed(2) })}
      </ThemedText>
    );
  }
  if (hasDeclared && !hasGpsArea) {
    return (
      <ThemedText type="caption" style={styles.areaCaption}>
        {tr('plot_hectares_declared', { n: dec.toFixed(2) })}
      </ThemedText>
    );
  }
  return (
    <ThemedText type="caption" style={styles.areaCaption}>
      {plot.areaHectares.toFixed(1)} {tr('ha_suffix')}
    </ThemedText>
  );
}

type PlotPickerIntent = 'receipts' | 'documents';

export default function PlotsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useThemedStyles(createExploreScreenStyles);
  const params = useLocalSearchParams<{ plotId?: string; focus?: string }>();
  const { plots, farmer } = useAppState();
  const { t, languageCode, openLanguagePicker } = useLanguage();

  const [backendPlots, setBackendPlots] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [photoCountByPlotId, setPhotoCountByPlotId] = useState<Record<string, number>>({});
  const [plotChecklistDoneByPlotId, setPlotChecklistDoneByPlotId] = useState<Record<string, boolean>>({});
  const [selectedPlotId, setSelectedPlotId] = useState<string | undefined>(plots[0]?.id);
  /** One-shot section from Home (vouchers/documents); cleared after first plot open. */
  const [pickerIntent, setPickerIntent] = useState<PlotPickerIntent | null>(null);
  const clearingFocusRef = useRef(false);

  const refreshVouchers = useCallback(() => {
    if (!farmer?.id) {
      setVouchers([]);
      return Promise.resolve();
    }
    return fetchVouchersForFarmer(farmer.id)
      .then((rows) => setVouchers(rows ?? []))
      .catch(() => setVouchers([]));
  }, [farmer?.id]);

  const refreshFromBackend = useCallback(
    (force = false) => {
      if (!farmer?.id) return Promise.resolve();
      return fetchServerPlotListForUi({
        profileFarmerId: farmer.id,
        localPlots: plots,
        force,
      })
        .then((rows) => setBackendPlots(rows ?? []))
        .catch(() => setBackendPlots([]));
    },
    [farmer?.id, plots],
  );

  const harvestCountForPlot = useCallback(
    (plot: Plot) => {
      const backend = findBackendPlotForLocal(plot, backendPlots) as { id?: unknown } | null;
      const backendId = backend?.id != null ? String(backend.id) : null;
      return countVouchersForPlot({
        vouchers,
        backendPlotId: backendId,
        localPlotId: plot.id,
      });
    },
    [vouchers, backendPlots],
  );

  // Capture Home deep-link intent once, then drop sticky ?focus= from the tab URL.
  useEffect(() => {
    if (clearingFocusRef.current) return;
    const focus = params.focus;
    if (focus !== 'receipts' && focus !== 'voucher' && focus !== 'documents') return;
    setPickerIntent(focus === 'voucher' ? 'receipts' : focus);
    clearingFocusRef.current = true;
    router.setParams({ focus: undefined, plotId: undefined });
    queueMicrotask(() => {
      clearingFocusRef.current = false;
    });
  }, [params.focus]);

  useEffect(() => {
    const pid = typeof params.plotId === 'string' ? params.plotId : undefined;
    if (!pid) return;
    setSelectedPlotId(pid);
    if (params.focus === 'photos') {
      router.replace(`/plot/${encodeURIComponent(pid)}?sub=photos`);
    }
  }, [params.plotId, params.focus]);

  // Home → receipts with multiple plots: skip list when only one plot has deliveries.
  useEffect(() => {
    if (pickerIntent !== 'receipts' || plots.length === 0) return;
    const withVouchers = plots.filter((plot) => harvestCountForPlot(plot) > 0);
    if (withVouchers.length !== 1) return;
    const targetId = withVouchers[0]!.id;
    setPickerIntent(null);
    router.replace(`/plot/${encodeURIComponent(targetId)}?sub=deliveries`);
  }, [pickerIntent, plots, vouchers, backendPlots, harvestCountForPlot]);

  const openPlotDetail = useCallback(
    (plotId: string) => {
      setSelectedPlotId(plotId);
      if (pickerIntent) {
        const intent = pickerIntent;
        setPickerIntent(null);
        router.push(`/plot/${encodeURIComponent(plotId)}?sub=${intent === 'receipts' ? 'deliveries' : intent}`);
        return;
      }
      router.push(`/plot/${encodeURIComponent(plotId)}`);
    },
    [pickerIntent],
  );

  useEffect(() => {
    if (!farmer?.id) {
      setBackendPlots([]);
      setVouchers([]);
      return;
    }
    void refreshFromBackend(false);
    void refreshVouchers();
  }, [farmer?.id, refreshFromBackend, refreshVouchers]);

  useFocusEffect(
    useCallback(() => {
      if (farmer?.id) {
        void refreshFromBackend(false);
        void refreshVouchers();
      }
    }, [farmer?.id, refreshFromBackend, refreshVouchers]),
  );

  const refreshPlotChecklists = useCallback(async () => {
    if (plots.length === 0) {
      setPhotoCountByPlotId({});
      setPlotChecklistDoneByPlotId({});
      return;
    }
    const results = await loadAllPlotReadinessStates(plots, backendPlots, farmer);
    setPhotoCountByPlotId(Object.fromEntries(results.map((r) => [r.plotId, r.photoCount])));
    setPlotChecklistDoneByPlotId(Object.fromEntries(results.map((r) => [r.plotId, r.done])));
  }, [plots, backendPlots, farmer]);

  useEffect(() => {
    void refreshPlotChecklists();
  }, [refreshPlotChecklists]);

  useFocusEffect(
    useCallback(() => {
      void refreshPlotChecklists();
    }, [refreshPlotChecklists]),
  );

  const statusForPlot = (plot: Plot): 'Compliant' | 'Action Needed' =>
    plotChecklistDoneByPlotId[plot.id] === true ? 'Compliant' : 'Action Needed';

  return (
    <ThemedView style={styles.screen}>
      <CompactTabHeader
        paddingTop={insets.top}
        left={<TabHeaderSpacer />}
        centerTitle={t('my_plots_header')}
        onLanguagePress={openLanguagePicker}
        languageLabel={languageCode}
        textInverseColor={colors.textInverse}
      />

      <ThemedScrollView contentContainerStyle={styles.containerCompact}>
        {plots.length === 0 ? (
          <Card variant="outlined" style={styles.emptyPlotsCard}>
            <View style={styles.emptyPlotsIconWrap}>
              <Ionicons name="map-outline" size={32} color="#0A7F59" />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.emptyPlotsTitle}>
              {t('walk_landing_headline')}
            </ThemedText>
            <ThemedText type="caption" style={styles.emptyPlotsBody}>
              {t('my_plots_empty')}
            </ThemedText>
            <Pressable style={styles.emptyPlotsCta} onPress={() => router.push('/record')}>
              <ThemedText type="defaultSemiBold" style={styles.emptyPlotsCtaText}>
                {t('walk_start_mapping')}
              </ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </Card>
        ) : null}

        {pickerIntent === 'receipts' ? (
          <Card variant="outlined" style={styles.pickerHintCard}>
            <ThemedText type="caption" style={styles.pickerHintText}>
              {t('plots_pick_receipts_hint')}
            </ThemedText>
          </Card>
        ) : null}
        {pickerIntent === 'documents' ? (
          <Card variant="outlined" style={styles.pickerHintCard}>
            <ThemedText type="caption" style={styles.pickerHintText}>
              {t('plots_pick_documents_hint')}
            </ThemedText>
          </Card>
        ) : null}

        {plots.map((plot) => {
          const status = statusForPlot(plot);
          const isComplete = status === 'Compliant';
          const uploadBlock = getPlotUploadGeometryBlock(plot, plots, t);
          const needsBoundaryFix = uploadBlock != null;
          const statusLabel = needsBoundaryFix
            ? t('plot_needs_boundary_fix')
            : isComplete
              ? t('status_compliant')
              : t('finish_setup_chip');
          const badgeVariant = needsBoundaryFix ? 'error' : isComplete ? 'success' : 'warning';
          const photosCount = photoCountByPlotId[plot.id] ?? 0;
          const harvestCount = harvestCountForPlot(plot);
          return (
            <Pressable
              key={plot.id}
              testID="plot-card"
              onPress={() => openPlotDetail(plot.id)}
            >
              <Card
                variant="outlined"
                style={[
                  styles.plotProtoCard,
                  selectedPlotId === plot.id && styles.plotProtoCardSelected,
                ]}
              >
                <View style={styles.plotCardRow}>
                  <PlotListThumbnail plot={plot} />
                  <View style={styles.plotCardBody}>
                    <View style={styles.rowHeader}>
                      <ThemedText type="subtitle" numberOfLines={2} style={styles.plotName}>
                        {plot.name}
                      </ThemedText>
                      <Badge variant={badgeVariant} size="sm">
                        {statusLabel}
                      </Badge>
                    </View>
                    <PlotListAreaCaption plot={plot} tr={t} />
                    <View style={styles.plotMetaRow}>
                      <View style={styles.plotMetaItem}>
                        <Ionicons name="camera-outline" size={15} color="#8A8A8A" />
                        <ThemedText type="caption" numberOfLines={1} style={styles.plotMetaText}>
                          {t('photos_meta_short', { n: photosCount })}
                        </ThemedText>
                      </View>
                      <View style={styles.plotMetaItem}>
                        <Ionicons name="scale-outline" size={15} color="#8A8A8A" />
                        <ThemedText type="caption" numberOfLines={1} style={styles.plotMetaText}>
                          {t('harvests_meta_short', { n: harvestCount })}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}

        <Pressable style={styles.registerNewPlotCard} onPress={() => router.push('/record')}>
          <Ionicons name="add" size={24} color={colors.link} />
          <ThemedText type="defaultSemiBold" style={{ color: colors.link }}>
            {t('register_new_plot')}
          </ThemedText>
        </Pressable>
      </ThemedScrollView>
    </ThemedView>
  );
}

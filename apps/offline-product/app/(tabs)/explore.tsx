import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
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
import {
  loadEvidenceForPlot,
  loadPhotosForPlot,
  loadTitlePhotosForPlot,
  getSetting,
} from '@/features/state/persistence';
import { fetchPlotsForFarmer, fetchVouchersForFarmer } from '@/features/api/postPlot';
import { computePlotReadinessChecklist } from '@/features/compliance/plotChecklist';
import { isGroundTruthPhotoSetComplete } from '@/features/compliance/groundTruthPhotoGeo';
import { countVouchersForPlot } from '@/features/harvest/voucherPlotCounts';
import { findBackendPlotForLocal } from '@/features/plots/backendPlotMatch';
import { computeRegionFromPlot } from '@/features/mapping/plotMapRegion';
import { CompactTabHeader, TabHeaderSpacer } from '@/components/layout/CompactTabHeader';
import { PlotListThumbnail } from '@/components/plot-map/PlotListThumbnail';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type PlotListTranslate = (key: string, values?: Record<string, string | number>) => string;

function renderPlotListAreaCaption(plot: Plot, tr: PlotListTranslate) {
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

export default function PlotsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ plotId?: string; focus?: string }>();
  const { plots, farmer, removePlot } = useAppState();
  const { t, languageCode, openLanguagePicker } = useLanguage();

  const [backendPlots, setBackendPlots] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [photoCountByPlotId, setPhotoCountByPlotId] = useState<Record<string, number>>({});
  const [plotChecklistDoneByPlotId, setPlotChecklistDoneByPlotId] = useState<Record<string, boolean>>({});
  const [selectedPlotId, setSelectedPlotId] = useState<string | undefined>(plots[0]?.id);
  const [offlineTilesEnabled, setOfflineTilesEnabled] = useState(false);
  const [offlineTilesPackId, setOfflineTilesPackId] = useState<string | null>(null);

  const refreshVouchers = useCallback(() => {
    if (!farmer?.id) {
      setVouchers([]);
      return Promise.resolve();
    }
    return fetchVouchersForFarmer(farmer.id)
      .then((rows) => setVouchers(rows ?? []))
      .catch(() => setVouchers([]));
  }, [farmer?.id]);

  const refreshFromBackend = useCallback(() => {
    if (!farmer?.id) return Promise.resolve();
    return fetchPlotsForFarmer(farmer.id)
      .then((rows) => setBackendPlots(rows ?? []))
      .catch(() => setBackendPlots([]));
  }, [farmer?.id]);

  useEffect(() => {
    const pid = typeof params.plotId === 'string' ? params.plotId : undefined;
    if (!pid) return;
    setSelectedPlotId(pid);
    if (params.focus === 'photos') {
      router.replace(`/plot/${encodeURIComponent(pid)}?sub=photos`);
    }
  }, [params.plotId, params.focus]);

  useEffect(() => {
    if (!farmer?.id) {
      setBackendPlots([]);
      setVouchers([]);
      return;
    }
    void refreshFromBackend();
    void refreshVouchers();
  }, [farmer?.id, refreshFromBackend, refreshVouchers]);

  useFocusEffect(
    useCallback(() => {
      if (farmer?.id) {
        void refreshFromBackend();
        void refreshVouchers();
      }
    }, [farmer?.id, refreshFromBackend, refreshVouchers]),
  );

  useEffect(() => {
    getSetting('offlineTilesEnabled')
      .then((v) => setOfflineTilesEnabled(v === '1'))
      .catch(() => undefined);
    getSetting('offlineTilesActivePackId')
      .then((v) => setOfflineTilesPackId(v && v.length > 0 ? v : null))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        plots.map(async (p) => {
          const backendMatch = findBackendPlotForLocal(p, backendPlots) as
            | { sinaph_overlap?: boolean; indigenous_overlap?: boolean; status?: string }
            | undefined;
          const [photos, titleRows, evidenceRows] = await Promise.all([
            loadPhotosForPlot(p.id).catch(() => []),
            loadTitlePhotosForPlot(p.id).catch(() => []),
            loadEvidenceForPlot(p.id).catch(() => []),
          ]);
          const evidenceKinds = evidenceRows
            .map((e: { kind?: string }) => e.kind)
            .filter((k): k is string => typeof k === 'string' && k.length > 0);
          const { done } = computePlotReadinessChecklist({
            groundTruthPhotos: photos,
            plot: p,
            titlePhotoCount: titleRows.length,
            evidenceKinds,
            isSyncedToServer: Boolean(backendMatch),
            backendFlags: backendMatch,
          });
          return {
            id: p.id,
            photoCount: photos.length,
            checklistDone: done,
          };
        }),
      );
      if (cancelled) return;
      setPhotoCountByPlotId(Object.fromEntries(entries.map((e) => [e.id, e.photoCount])));
      setPlotChecklistDoneByPlotId(Object.fromEntries(entries.map((e) => [e.id, e.checklistDone])));
    })();
    return () => {
      cancelled = true;
    };
  }, [plots, backendPlots]);

  const statusForPlot = (plot: Plot): 'Compliant' | 'Action Needed' => {
    const backend = findBackendPlotForLocal(plot, backendPlots) as { status?: string } | null;
    if (plotChecklistDoneByPlotId[plot.id] === true) return 'Compliant';
    if (!backend) return 'Action Needed';
    return backend.status === 'compliant' ? 'Compliant' : 'Action Needed';
  };

  const harvestCountForPlot = (plot: Plot) => {
    const backend = findBackendPlotForLocal(plot, backendPlots) as { id?: unknown } | null;
    const backendId = backend?.id != null ? String(backend.id) : null;
    return countVouchersForPlot({
      vouchers,
      backendPlotId: backendId,
      localPlotId: plot.id,
    });
  };

  const confirmDeletePlot = (plot: Plot) => {
    Alert.alert(t('warning'), t('delete_plot_body'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          const fallback = plots.find((p) => p.id !== plot.id)?.id;
          removePlot(plot.id);
          if (selectedPlotId === plot.id) setSelectedPlotId(fallback);
        },
      },
    ]);
  };

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
              <Ionicons name="walk-outline" size={32} color="#0A7F59" />
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

        {plots.map((plot) => {
          const status = statusForPlot(plot);
          const isComplete = status === 'Compliant';
          const statusLabel = isComplete ? t('status_compliant') : t('finish_setup_chip');
          const badgeVariant = isComplete ? 'success' : 'warning';
          const photosCount = photoCountByPlotId[plot.id] ?? 0;
          const harvestCount = harvestCountForPlot(plot);
          const region = computeRegionFromPlot(plot);

          return (
            <Pressable
              key={plot.id}
              onPress={() => {
                setSelectedPlotId(plot.id);
                router.push(`/plot/${encodeURIComponent(plot.id)}`);
              }}
            >
              <Card
                variant="outlined"
                style={[
                  styles.plotProtoCard,
                  selectedPlotId === plot.id && styles.plotProtoCardSelected,
                ]}
              >
                <View style={styles.plotCardRow}>
                  <PlotListThumbnail
                    plot={plot}
                    region={region}
                    offlineTilesEnabled={offlineTilesEnabled}
                    offlineTilesPackId={offlineTilesPackId}
                  />
                  <View style={styles.plotCardBody}>
                    <View style={styles.rowHeader}>
                      <ThemedText type="subtitle" numberOfLines={2} style={styles.plotName}>
                        {plot.name}
                      </ThemedText>
                      <View style={styles.plotCardActions}>
                        <Badge variant={badgeVariant} size="sm">
                          {statusLabel}
                        </Badge>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            confirmDeletePlot(plot);
                          }}
                          style={styles.deletePlotButton}
                          accessibilityLabel={t('delete')}
                        >
                          <Ionicons name="trash-outline" size={14} color="#B42318" />
                        </Pressable>
                      </View>
                    </View>
                    {renderPlotListAreaCaption(plot, t)}
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
          <Ionicons name="add" size={24} color="#0B6F50" />
          <ThemedText type="defaultSemiBold" style={{ color: '#0B6F50' }}>
            {t('register_new_plot')}
          </ThemedText>
        </Pressable>
      </ThemedScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  containerCompact: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  emptyPlotsCard: {
    borderRadius: 18,
    borderColor: '#AEE6D3',
    backgroundColor: '#E8F7F0',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyPlotsIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPlotsTitle: {
    color: '#0B4F3B',
    textAlign: 'center',
  },
  emptyPlotsBody: {
    color: '#1F6B57',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyPlotsCta: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0A7F59',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    minHeight: 48,
  },
  emptyPlotsCtaText: { color: '#FFFFFF' },
  plotProtoCard: { borderRadius: 18, padding: 12 },
  plotProtoCardSelected: { borderColor: '#74D7B8', borderWidth: 1.8 },
  plotCardRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  plotCardBody: { flex: 1, minWidth: 0 },
  plotName: { flex: 1 },
  areaCaption: { marginTop: 4, color: '#6B7280' },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  plotCardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deletePlotButton: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F5C2C0',
    backgroundColor: '#FFF1F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plotMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  plotMetaItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  plotMetaText: {
    flexShrink: 1,
    color: '#6B7280',
    fontSize: 12,
  },
  registerNewPlotCard: {
    marginTop: 6,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#6FD3B2',
    borderRadius: 18,
    backgroundColor: '#DDEFE8',
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});

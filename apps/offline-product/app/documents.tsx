import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

import { ProducerAttestationsCard } from '@/components/compliance/ProducerAttestationsCard';
import { DocumentListRow } from '@/components/evidence/DocumentListRow';
import { DocumentPreviewModal } from '@/components/evidence/DocumentPreviewModal';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActionButton as Button } from '@/components/ui/action-button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchPlotsForFarmer } from '@/features/api/postPlot';
import { hasProducerAttestationsComplete } from '@/features/compliance/farmerDeclarations';
import {
  loadAllPlotReadinessStates,
  type PlotReadinessLoadResult,
} from '@/features/compliance/loadPlotReadiness';
import { producerEvidenceScopeId } from '@/features/evidence/evidenceScope';
import type { DocumentPreviewItem } from '@/features/evidence/documentPreview';
import {
  countPlotsNeedingLandDocuments,
  summarizePlotDocumentsForOverview,
} from '@/features/evidence/plotDocumentSummary';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import {
  loadEvidenceForPlot,
  persistPlotEvidenceItem,
  type PlotEvidenceItem,
  type PlotEvidenceKind,
} from '@/features/state/persistence';

function chipBadgeVariant(
  variant: 'success' | 'warning' | 'info' | 'default',
): 'success' | 'warning' | 'info' | 'default' {
  return variant;
}

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { farmer, plots } = useAppState();
  const { lang, t } = useLanguage();
  const { isSignedIn } = useSignInSheet();

  const [profileDocs, setProfileDocs] = useState<PlotEvidenceItem[]>([]);
  const [backendPlots, setBackendPlots] = useState<unknown[]>([]);
  const [plotReadiness, setPlotReadiness] = useState<PlotReadinessLoadResult[]>([]);
  const [previewItem, setPreviewItem] = useState<DocumentPreviewItem | null>(null);

  const refreshProfileDocs = useCallback(async () => {
    if (!farmer?.id) {
      setProfileDocs([]);
      return;
    }
    try {
      const rows = await loadEvidenceForPlot(producerEvidenceScopeId(farmer.id));
      setProfileDocs(rows);
    } catch {
      setProfileDocs([]);
    }
  }, [farmer?.id]);

  const refreshPlotReadiness = useCallback(async () => {
    if (plots.length === 0) {
      setPlotReadiness([]);
      return;
    }
    const results = await loadAllPlotReadinessStates(plots, backendPlots, farmer);
    setPlotReadiness(results);
  }, [plots, backendPlots, farmer]);

  useEffect(() => {
    void refreshProfileDocs();
  }, [refreshProfileDocs]);

  useFocusEffect(
    useCallback(() => {
      if (farmer?.id && isSignedIn) {
        fetchPlotsForFarmer(farmer.id)
          .then((rows) => setBackendPlots(rows ?? []))
          .catch(() => setBackendPlots([]));
      } else {
        setBackendPlots([]);
      }
    }, [farmer?.id, isSignedIn]),
  );

  useEffect(() => {
    void refreshPlotReadiness();
  }, [refreshPlotReadiness]);

  const counts = useMemo(() => {
    const byKind = (items: PlotEvidenceItem[], kind: PlotEvidenceKind) =>
      items.filter((i) => i.kind === kind).length;
    return {
      total: profileDocs.length,
      fpic: byKind(profileDocs, 'fpic_repository'),
      labor: byKind(profileDocs, 'labor_evidence'),
    };
  }, [profileDocs]);

  const producerAttestationsComplete = hasProducerAttestationsComplete(farmer);

  const overviewStrip = useMemo(() => {
    const attestationsLabel = producerAttestationsComplete
      ? t('documents_overview_attestations_done')
      : t('documents_overview_attestations_pending');
    const producerDocsLabel =
      counts.total > 0
        ? t('documents_overview_producer_files', { n: counts.total })
        : t('documents_overview_producer_files_none');
    const needsLand = countPlotsNeedingLandDocuments(plotReadiness);
    const plotsLabel =
      plots.length === 0
        ? t('documents_overview_no_plots')
        : needsLand > 0
          ? t('documents_overview_plots_need_land', { needs: needsLand, total: plots.length })
          : t('documents_overview_plots_all_good', { total: plots.length });
    return { attestationsLabel, producerDocsLabel, plotsLabel };
  }, [counts.total, plotReadiness, plots.length, producerAttestationsComplete, t]);

  const sortedPlotRows = useMemo(() => {
    const readinessById = Object.fromEntries(plotReadiness.map((r) => [r.plotId, r]));
    return [...plots]
      .map((plot) => {
        const readiness = readinessById[plot.id];
        const status = readiness
          ? summarizePlotDocumentsForOverview(readiness.checklist, {
              titlePhotos: readiness.titlePhotoCount,
              evidenceCount: readiness.evidenceCount,
            })
          : summarizePlotDocumentsForOverview(
              {
                groundOk: false,
                landOk: false,
                tenureParseGate: 'not_applicable',
                needsFpic: false,
                needsPermit: false,
                fpicOk: false,
                permitOk: false,
                syncOk: false,
                done: false,
              },
              { titlePhotos: 0, evidenceCount: 0 },
            );
        return { plot, readiness, status };
      })
      .sort((a, b) => a.status.priority - b.status.priority || a.plot.name.localeCompare(b.plot.name));
  }, [plots, plotReadiness]);

  const openPreview = (item: PlotEvidenceItem) => {
    setPreviewItem({
      uri: item.uri,
      mimeType: item.mimeType,
      label: item.label,
    });
  };

  const addProfileDoc = async (kind: PlotEvidenceKind, label: string) => {
    if (!farmer?.id) return;
    const picked = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled || !picked.assets?.[0]?.uri) return;
    const asset = picked.assets[0];
    try {
      await persistPlotEvidenceItem({
        plotId: producerEvidenceScopeId(farmer.id),
        kind,
        uri: asset.uri,
        mimeType: asset.mimeType ?? null,
        label: asset.name ?? label,
        takenAt: Date.now(),
      });
      await refreshProfileDocs();
    } catch {
      Alert.alert(t('documents_save_failed_title'), t('documents_save_failed_body'));
    }
  };

  const renderProducerDocs = (kind: PlotEvidenceKind, fallbackKey: string, badgeKey: string) =>
    profileDocs
      .filter((d) => d.kind === kind)
      .map((d) => (
        <DocumentListRow
          key={d.id}
          label={d.label ?? t(fallbackKey)}
          dateLabel={new Date(d.takenAt).toLocaleDateString()}
          badgeLabel={t(badgeKey)}
          uri={d.uri}
          mimeType={d.mimeType}
          onPress={() => openPreview(d)}
        />
      ));

  return (
    <ThemedView style={styles.screen}>
      <LinearGradient
        colors={['#0A7F59', '#0B6F50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backPill}>
            <Ionicons name="chevron-back" size={18} color={colors.textInverse} />
            <ThemedText type="caption" style={{ color: colors.textInverse }}>
              {t('back')}
            </ThemedText>
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
              {t('documents_my_docs')}
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textInverse, opacity: 0.9 }}>
              {t('documents_producer_scope_subtitle')}
            </ThemedText>
          </View>
          <View style={styles.langPill}>
            <Ionicons name="language" size={16} color={colors.textInverse} />
            <ThemedText type="caption" style={{ color: colors.textInverse }}>
              {String(lang).toUpperCase()}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      <ThemedScrollView contentContainerStyle={styles.container}>
        <Card variant="elevated" style={styles.statusStrip}>
          <ThemedText type="defaultSemiBold">{t('documents_overview_status_title')}</ThemedText>
          <ThemedText type="caption" style={styles.stripLine}>
            {t('documents_overview_producer_line', {
              attestations: overviewStrip.attestationsLabel,
              files: overviewStrip.producerDocsLabel,
            })}
          </ThemedText>
          <ThemedText type="caption" style={styles.stripLine}>
            {overviewStrip.plotsLabel}
          </ThemedText>
        </Card>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.rowHeader}>
            <ThemedText type="defaultSemiBold">{t('documents_producer_scope_title')}</ThemedText>
            <Badge variant="default" size="sm">
              {counts.total}
            </Badge>
          </View>
          <ThemedText type="caption">{t('documents_producer_scope_body')}</ThemedText>
        </Card>

        <ProducerAttestationsCard />

        <Card variant="elevated" style={styles.card}>
          <View style={styles.rowHeader}>
            <ThemedText type="defaultSemiBold">{t('documents_fpic_section')}</ThemedText>
            <Badge variant={counts.fpic > 0 ? 'info' : 'default'} size="sm">
              {counts.fpic}
            </Badge>
          </View>
          <ThemedText type="caption">{t('documents_fpic_body')}</ThemedText>
          <View style={{ gap: 10, marginTop: 10 }}>
            <Button
              title={t('documents_add_fpic')}
              variant="secondary"
              onPress={() => void addProfileDoc('fpic_repository', 'fpic_doc')}
            />
          </View>
          <View style={styles.docList}>{renderProducerDocs('fpic_repository', 'documents_fpic_fallback', 'documents_badge_fpic')}</View>
        </Card>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.rowHeader}>
            <ThemedText type="defaultSemiBold">{t('documents_labor_section')}</ThemedText>
            <Badge variant={counts.labor > 0 ? 'info' : 'default'} size="sm">
              {counts.labor}
            </Badge>
          </View>
          <ThemedText type="caption">{t('documents_labor_body')}</ThemedText>
          <View style={{ gap: 10, marginTop: 10 }}>
            <Button
              title={t('documents_add_labor')}
              variant="secondary"
              onPress={() => void addProfileDoc('labor_evidence', 'labor_doc')}
            />
          </View>
          <View style={styles.docList}>{renderProducerDocs('labor_evidence', 'documents_labor_fallback', 'documents_badge_labor')}</View>
        </Card>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.rowHeader}>
            <ThemedText type="defaultSemiBold">{t('documents_plot_scope_title')}</ThemedText>
            <Badge variant="info" size="sm">
              {plots.length}
            </Badge>
          </View>
          <ThemedText type="caption">{t('documents_plot_scope_body')}</ThemedText>
          <View style={{ gap: 10, marginTop: 10 }}>
            {plots.length === 0 ? (
              <View style={styles.emptyPlots}>
                <ThemedText type="caption">{t('documents_no_plots')}</ThemedText>
                <Button
                  title={t('documents_empty_plots_cta')}
                  variant="secondary"
                  onPress={() => router.push('/(tabs)')}
                />
              </View>
            ) : (
              sortedPlotRows.map(({ plot, status }) => (
                <Pressable
                  key={plot.id}
                  onPress={() =>
                    router.push(`/plot/${encodeURIComponent(plot.id)}?sub=documents&from=documents`)
                  }
                >
                  <Card variant="outlined" style={styles.rowCard}>
                    <View style={styles.rowHeader}>
                      <ThemedText type="defaultSemiBold" style={styles.plotName} numberOfLines={2}>
                        {plot.name}
                      </ThemedText>
                      <Badge variant={chipBadgeVariant(status.chipVariant)} size="sm">
                        {t(status.chipKey, status.chipParams)}
                      </Badge>
                    </View>
                  </Card>
                </Pressable>
              ))
            )}
          </View>
        </Card>
      </ThemedScrollView>

      <DocumentPreviewModal
        visible={previewItem != null}
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 6, paddingBottom: 4 },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  container: { padding: 16, paddingBottom: 32, gap: 12 },
  statusStrip: { gap: 6 },
  stripLine: { color: '#4B5563' },
  card: { marginTop: 2 },
  rowCard: { padding: 12 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  plotName: {
    flex: 1,
    minWidth: 0,
  },
  docList: { gap: 8, marginTop: 10 },
  emptyPlots: { gap: 10 },
});

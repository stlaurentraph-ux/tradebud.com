import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { StackGradientHeader } from '@/components/layout/StackGradientHeader';
import { router, useFocusEffect } from 'expo-router';

import { ProducerDeclarationsSection } from '@/components/evidence/ProducerDeclarationsSection';
import { ProducerSupportingFilesSection } from '@/components/evidence/ProducerSupportingFilesSection';
import { DocumentPreviewModal } from '@/components/evidence/DocumentPreviewModal';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActionButton as Button } from '@/components/ui/action-button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchServerPlotListForUi } from '@/features/sync/serverPlotListCache';
import { hasProducerAttestationsComplete } from '@/features/compliance/farmerDeclarations';
import {
  loadAllPlotReadinessStates,
  type PlotReadinessLoadResult,
} from '@/features/compliance/loadPlotReadiness';
import { producerEvidenceScopeId } from '@/features/evidence/evidenceScope';
import type { DocumentPreviewItem } from '@/features/evidence/documentPreview';
import { pickEvidenceFile } from '@/features/evidence/pickEvidenceFile';
import { resolveProducerDocumentsNextStep } from '@/features/evidence/producerDocumentNextStep';
import { summarizePlotDocumentsForOverview } from '@/features/evidence/plotDocumentSummary';
import { sortPlotsForDisplay } from '@/features/plots/stablePlotDisplayOrder';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import {
  deletePlotEvidenceItem,
  loadEvidenceForPlot,
  persistPlotEvidenceItem,
  type PlotEvidenceItem,
  type PlotEvidenceKind,
} from '@/features/state/persistence';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { createDocumentsScreenStyles } from '@/app/documentsScreenStyles';
import {
  hasSyncedPlotForFarmer,
  producerSupportingHasPendingSync,
  uploadProducerSupportingEvidence,
} from '@/features/evidence/producerSupportingEvidence';

function chipBadgeVariant(
  variant: 'success' | 'warning' | 'info' | 'default',
): 'success' | 'warning' | 'info' | 'default' {
  return variant;
}

export default function DocumentsScreen() {
  const styles = useThemedStyles(createDocumentsScreenStyles);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { farmer, plots, reloadFromDisk } = useAppState();
  const { lang, t, openLanguagePicker } = useLanguage();
  const { isSignedIn } = useSignInSheet();

  const [profileDocs, setProfileDocs] = useState<PlotEvidenceItem[]>([]);
  const [backendPlots, setBackendPlots] = useState<unknown[]>([]);
  const [plotReadiness, setPlotReadiness] = useState<PlotReadinessLoadResult[]>([]);
  const [previewItem, setPreviewItem] = useState<DocumentPreviewItem | null>(null);
  const [attestationsEditRequest, setAttestationsEditRequest] = useState(0);
  const [supportingExpanded, setSupportingExpanded] = useState(false);
  const [hasSyncedPlot, setHasSyncedPlot] = useState(false);
  const [pendingProducerSync, setPendingProducerSync] = useState(false);
  const [supportingUploadNote, setSupportingUploadNote] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const plotReadinessGenerationRef = useRef(0);
  const attestationsAnchorRef = useRef<View>(null);
  const supportingAnchorRef = useRef<View>(null);

  const scrollToSection = useCallback((anchorRef: RefObject<View | null>, delayMs = 0) => {
    const run = () => {
      const anchor = anchorRef.current;
      const scrollView = scrollRef.current;
      if (!anchor || !scrollView) return;

      anchor.measureInWindow((_ax, anchorPageY) => {
        const scrollHost = scrollView as unknown as View;
        scrollHost.measureInWindow((_sx: number, scrollPageY: number) => {
          const topInset = 12;
          const targetY = scrollYRef.current + (anchorPageY - scrollPageY) - topInset;
          scrollView.scrollTo({ y: Math.max(0, targetY), animated: true });
        });
      });
    };
    const schedule = () => requestAnimationFrame(() => requestAnimationFrame(run));
    if (delayMs > 0) {
      setTimeout(schedule, delayMs);
    } else {
      schedule();
    }
  }, []);

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
    const generation = ++plotReadinessGenerationRef.current;
    const results = await loadAllPlotReadinessStates(plots, backendPlots, farmer);
    if (generation !== plotReadinessGenerationRef.current) return;
    setPlotReadiness(results);
  }, [plots, backendPlots, farmer]);

  useEffect(() => {
    void refreshProfileDocs();
  }, [refreshProfileDocs]);

  const refreshSupportingSyncMeta = useCallback(async () => {
    if (!farmer?.id) {
      setHasSyncedPlot(false);
      setPendingProducerSync(false);
      return;
    }
    const [syncedPlot, pending] = await Promise.all([
      hasSyncedPlotForFarmer({
        farmerId: farmer.id,
        localPlots: plots,
        backendPlots,
      }),
      producerSupportingHasPendingSync(farmer.id),
    ]);
    setHasSyncedPlot(syncedPlot);
    setPendingProducerSync(pending);
  }, [backendPlots, farmer?.id, plots]);

  const tryUploadSupportingDocs = useCallback(async () => {
    if (!farmer?.id) return;
    const outcome = await uploadProducerSupportingEvidence({
      farmerId: farmer.id,
      localPlots: plots,
      backendPlots,
    });
    await refreshProfileDocs();
    await refreshSupportingSyncMeta();
    if (outcome.status === 'uploaded') {
      setSupportingUploadNote(t('plot_documents_auto_upload_ok', { n: outcome.uploadedCount }));
    } else if (outcome.status === 'queued') {
      setSupportingUploadNote(t('plot_documents_auto_upload_queued'));
    } else if (outcome.status === 'local_only' && outcome.reason === 'not_signed_in') {
      setSupportingUploadNote(t('plot_documents_auto_upload_local_only'));
    } else {
      setSupportingUploadNote(null);
    }
  }, [backendPlots, farmer?.id, plots, refreshProfileDocs, refreshSupportingSyncMeta, t]);

  useEffect(() => {
    void refreshSupportingSyncMeta();
  }, [refreshSupportingSyncMeta]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        await reloadFromDisk();
        if (cancelled) return;
        await refreshProfileDocs();
        await refreshSupportingSyncMeta();
        if (isSignedIn && farmer?.id) {
          const alreadyQueued = await producerSupportingHasPendingSync(farmer.id);
          if (!alreadyQueued) {
            await tryUploadSupportingDocs();
          }
        }
        if (cancelled) return;
        if (farmer?.id && isSignedIn) {
          void fetchServerPlotListForUi({
            profileFarmerId: farmer.id,
            localPlots: plots,
          })
            .then((rows) => {
              if (!cancelled) setBackendPlots(rows ?? []);
            })
            .catch(() => undefined);
        } else if (!cancelled) {
          setBackendPlots([]);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [farmer?.id, isSignedIn, plots, reloadFromDisk, refreshProfileDocs, refreshSupportingSyncMeta, tryUploadSupportingDocs]),
  );

  useEffect(() => {
    void refreshPlotReadiness();
  }, [refreshPlotReadiness]);

  const producerAttestationsComplete = hasProducerAttestationsComplete(farmer);

  const nextStep = useMemo(
    () =>
      resolveProducerDocumentsNextStep({
        farmer,
        profileDocCount: profileDocs.length,
        plotReadiness,
        plots,
      }),
    [farmer, profileDocs.length, plotReadiness, plots],
  );

  useEffect(() => {
    if (nextStep.kind === 'producer_files_optional') {
      setSupportingExpanded(true);
    }
  }, [nextStep.kind]);

  const plotDocumentRows = useMemo(() => {
    const readinessById = Object.fromEntries(plotReadiness.map((r) => [r.plotId, r]));
    return sortPlotsForDisplay(plots).map((plot) => {
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
      return { plot, status };
    });
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
    const picked = await pickEvidenceFile({
      pick_source_title: t('evidence_pick_source_title'),
      pick_source_body: t('evidence_pick_source_body'),
      pick_browse_files: t('evidence_pick_browse_files'),
      pick_failed_title: t('evidence_pick_failed_title'),
      pick_failed_body: t('evidence_pick_failed_body'),
      pick_photo_library: t('evidence_pick_photo_library'),
      pick_take_photo: t('evidence_pick_take_photo'),
      pick_cancel: t('cancel'),
      perm_library_title: t('evidence_perm_library_title'),
      perm_library_body: t('evidence_perm_library_body'),
      perm_camera_title: t('evidence_perm_camera_title'),
      perm_camera_body: t('evidence_perm_camera_body'),
    });
    if (!picked) return;
    try {
      await persistPlotEvidenceItem({
        plotId: producerEvidenceScopeId(farmer.id),
        kind,
        uri: picked.uri,
        mimeType: picked.mimeType,
        label,
        takenAt: Date.now(),
      });
      await refreshProfileDocs();
      if (isSignedIn) {
        await tryUploadSupportingDocs();
      } else {
        setSupportingUploadNote(t('plot_documents_auto_upload_local_only'));
        await refreshSupportingSyncMeta();
      }
    } catch {
      Alert.alert(t('documents_save_failed_title'), t('documents_save_failed_body'));
    }
  };

  const deleteProfileDoc = (item: PlotEvidenceItem) => {
    Alert.alert(t('documents_delete_supporting_title'), t('documents_delete_supporting_body'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deletePlotEvidenceItem(item.id);
            if (previewItem?.uri === item.uri) {
              setPreviewItem(null);
            }
            await refreshProfileDocs();
            await refreshSupportingSyncMeta();
          })();
        },
      },
    ]);
  };

  const handleNextStep = () => {
    if (nextStep.kind === 'plot_land') {
      router.push(`/plot/${encodeURIComponent(nextStep.plotId)}?sub=documents&from=documents`);
      return;
    }
    if (nextStep.kind === 'attestations') {
      if (!farmer?.id) {
        Alert.alert(t('documents_no_farmer'), undefined, [
          { text: t('documents_empty_plots_cta'), onPress: () => router.push('/(tabs)') },
          { text: t('cancel'), style: 'cancel' },
        ]);
        return;
      }
      setAttestationsEditRequest((n) => n + 1);
      scrollToSection(attestationsAnchorRef, 100);
      return;
    }
    if (nextStep.kind === 'producer_files_optional') {
      setSupportingExpanded(true);
      scrollToSection(supportingAnchorRef, 100);
    }
  };

  const heroTitle =
    nextStep.kind === 'all_set'
      ? t('documents_hero_all_set_title')
      : nextStep.kind === 'attestations'
        ? t('documents_hero_attestations_title')
        : nextStep.kind === 'plot_land'
          ? nextStep.plotCount === 1
            ? t('documents_hero_plots_valid_land_title_one')
            : t('documents_hero_plots_valid_land_title_other', { n: nextStep.plotCount })
          : t('documents_hero_optional_files_title');

  const heroBody =
    nextStep.kind === 'all_set'
      ? t('documents_hero_all_set_body', { n: plots.length })
      : nextStep.kind === 'attestations'
        ? t('documents_hero_attestations_body')
        : nextStep.kind === 'plot_land'
          ? t('documents_hero_plots_valid_land_body')
          : t('documents_hero_optional_files_body');

  const declarationsSection = farmer?.id ? (
    <ProducerDeclarationsSection
      sectionRef={attestationsAnchorRef}
      openEditingRequest={attestationsEditRequest}
    />
  ) : null;

  const plotLandPapersSection = (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.rowHeader}>
        <ThemedText type="defaultSemiBold">{t('documents_plot_land_papers_title')}</ThemedText>
        <Badge variant="info" size="sm">
          {plots.length}
        </Badge>
      </View>
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
          plotDocumentRows.map(({ plot, status }) => (
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
  );

  return (
    <ThemedView style={styles.screen}>
      <StackGradientHeader
        title={t('documents_my_docs')}
        onBack={() => router.back()}
        backLabel={t('back')}
        langLabel={String(lang).toUpperCase()}
        onLangPress={openLanguagePicker}
        langAccessibilityLabel={t('language_picker_title')}
      />

      <ThemedScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={(event) => {
          scrollYRef.current = event.nativeEvent.contentOffset.y;
        }}
        contentContainerStyle={styles.container}
      >
        <Card variant="elevated" style={styles.heroCard}>
          <ThemedText type="defaultSemiBold">{heroTitle}</ThemedText>
          <ThemedText type="caption" style={styles.heroBody}>
            {heroBody}
          </ThemedText>
          {nextStep.kind !== 'all_set' ? (
            <View style={{ marginTop: 12 }}>
              <Button
                title={
                  nextStep.kind === 'plot_land'
                    ? t('documents_hero_cta_plot')
                    : nextStep.kind === 'attestations'
                      ? t('documents_hero_cta_attestations')
                      : t('documents_hero_cta_optional')
                }
                variant="primary"
                onPress={handleNextStep}
              />
            </View>
          ) : null}
        </Card>

        {producerAttestationsComplete ? (
          <>
            {plotLandPapersSection}
            {declarationsSection}
          </>
        ) : (
          <>
            {declarationsSection}
            {plotLandPapersSection}
          </>
        )}

        {farmer?.id ? (
          <ProducerSupportingFilesSection
            profileDocs={profileDocs}
            declarationsComplete={producerAttestationsComplete}
            expanded={supportingExpanded}
            onExpandedChange={setSupportingExpanded}
            sectionRef={supportingAnchorRef}
            isSignedIn={isSignedIn}
            hasSyncedPlot={hasSyncedPlot}
            pendingProducerSync={pendingProducerSync}
            onPreview={openPreview}
            onAddDoc={addProfileDoc}
            onDeleteDoc={deleteProfileDoc}
          />
        ) : null}
        {supportingUploadNote ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {supportingUploadNote}
          </ThemedText>
        ) : null}
      </ThemedScrollView>

      <DocumentPreviewModal
        visible={previewItem != null}
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </ThemedView>
  );
}


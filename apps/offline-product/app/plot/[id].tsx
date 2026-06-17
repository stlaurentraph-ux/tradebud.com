import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { PhotoVaultPanel } from '@/components/plot-photo-vault/PhotoVaultPanel';
import QRCode from 'react-native-qrcode-svg';

import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Badge } from '@/components/ui/badge';
import { Button as UiButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ActionButton as Button } from '@/components/ui/action-button';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppState, type Plot } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  fetchPlotTenureVerification,
  fetchPlotsForFarmer,
  fetchVouchersForFarmer,
  updatePlotMetadataOnBackend,
  type PlotTenureVerificationRecord,
} from '@/features/api/postPlot';
import {
  loadPhotosForPlot,
  loadPlotCadastralKey,
  loadPlotTenure,
  loadTitlePhotosForPlot,
  loadEvidenceForPlot,
  persistPlotTitlePhoto,
  getSetting,
  type PlotPhoto,
  type PlotTitlePhoto,
  type PlotEvidenceItem,
} from '@/features/state/persistence';
import { PlotEvidencePanel } from '@/components/evidence/PlotEvidencePanel';
import { PlotTenureStatusCard } from '@/components/compliance/PlotTenureStatusCard';
import { PlotComplianceStatusCards } from '@/components/compliance/PlotComplianceStatusCards';
import { PlotMapPreview } from '@/components/plot-map/PlotMapPreview';
import { pickEvidenceFile } from '@/features/evidence/pickEvidenceFile';
import {
  autoUploadLandTitleDocuments,
  type AutoUploadOutcome,
} from '@/features/evidence/autoUploadPlotDocuments';
import {
  MIN_GROUND_TRUTH_PHOTOS,
  computePlotReadinessChecklist,
} from '@/features/compliance/plotChecklist';
import {
  describeTenureVerificationReview,
  formatTenureVerificationReviewMessage,
} from '@/features/compliance/plotTenureVerificationReview';
import { countGeoVerifiedGroundTruthDirections } from '@/features/compliance/groundTruthPhotoGeo';
import { findBackendPlotForLocal } from '@/features/plots/backendPlotMatch';
import { resolveHarvestPlotPickerId } from '@/features/harvest/mergeHarvestPlotOptions';
import { resolvePlotAreaHa } from '@/features/harvest/plotYieldCapacity';
import { computeRegionFromPlot } from '@/features/mapping/plotMapRegion';

type Sub = 'photos' | 'documents' | 'harvests' | 'voucher';
type SetupTarget = Sub | 'settings';

export default function PlotDetailScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { id, sub } = useLocalSearchParams<{ id: string; sub?: Sub }>();
  const { plots, farmer, updatePlot } = useAppState();
  const { t, lang, openLanguagePicker } = useLanguage();

  const plotId = typeof id === 'string' ? id : '';
  const plot = useMemo(() => plots.find((p) => p.id === plotId) ?? null, [plots, plotId]);

  const [active, setActive] = useState<Sub | null>((sub as Sub) ?? null);
  const [photos, setPhotos] = useState<PlotPhoto[]>([]);
  const [titlePhotos, setTitlePhotos] = useState<PlotTitlePhoto[]>([]);
  const [evidence, setEvidence] = useState<PlotEvidenceItem[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [backendPlots, setBackendPlots] = useState<any[]>([]);
  const [, setLoadingBackend] = useState(false);
  const [, setBackendError] = useState<string | null>(null);
  const [backendPlotMeta, setBackendPlotMeta] = useState<{
    id: string | null;
    status: unknown;
    deforestationScreening: unknown;
    sinaph: boolean;
    indigenous: boolean;
  }>({
    id: null,
    status: 'pending_check',
    deforestationScreening: null,
    sinaph: false,
    indigenous: false,
  });
  const [tenureVerifications, setTenureVerifications] = useState<PlotTenureVerificationRecord[]>([]);
  const backendPlotId = backendPlotMeta.id;
  const overlapFlags = useMemo(
    () => ({ sinaph: backendPlotMeta.sinaph, indigenous: backendPlotMeta.indigenous }),
    [backendPlotMeta.indigenous, backendPlotMeta.sinaph],
  );
  const voucherShareCaptureRef = useRef<View>(null);
  const [voucherShareBusy, setVoucherShareBusy] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [declaredHaDraft, setDeclaredHaDraft] = useState('');
  const [cadastralKey, setCadastralKey] = useState('');
  const [informalTenure, setInformalTenure] = useState(false);
  const [informalTenureNote, setInformalTenureNote] = useState('');
  const [legalSyncReason, setLegalSyncReason] = useState('');
  const [docSyncMessage, setDocSyncMessage] = useState<string | null>(null);
  const [docSyncTone, setDocSyncTone] = useState<'success' | 'error' | 'info'>('info');
  const [addingTitlePhoto, setAddingTitlePhoto] = useState(false);
  const [offlineTilesEnabled, setOfflineTilesEnabled] = useState(false);
  const [offlineTilesPackId, setOfflineTilesPackId] = useState<string | null>(null);

  const plotMapRegion = useMemo(
    () => (plot ? computeRegionFromPlot(plot) : undefined),
    [plot],
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
    if (!plotId) return;
    loadPhotosForPlot(plotId).then(setPhotos).catch(() => setPhotos([]));
    loadTitlePhotosForPlot(plotId).then(setTitlePhotos).catch(() => setTitlePhotos([]));
    loadEvidenceForPlot(plotId).then(setEvidence).catch(() => setEvidence([]));
    loadPlotCadastralKey(plotId)
      .then((key) => setCadastralKey(key ?? ''))
      .catch(() => setCadastralKey(''));
    loadPlotTenure(plotId)
      .then((row) => {
        setInformalTenure(row.informalTenure);
        setInformalTenureNote(row.informalTenureNote ?? '');
      })
      .catch(() => {
        setInformalTenure(false);
        setInformalTenureNote('');
      });
  }, [plotId]);

  useEffect(() => {
    if (!farmer?.id) {
      setBackendPlots([]);
      setBackendError(null);
      setBackendPlotMeta({
        id: null,
        status: 'pending_check',
        deforestationScreening: null,
        sinaph: false,
        indigenous: false,
      });
      return;
    }
    setLoadingBackend(true);
    setBackendError(null);
    fetchPlotsForFarmer(farmer.id)
      .then((rows) => setBackendPlots(rows ?? []))
      .catch((err) => {
        setBackendPlots([]);
        setBackendError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoadingBackend(false));
  }, [farmer?.id]);

  useEffect(() => {
    if (!plot) {
      setBackendPlotMeta({
        id: null,
        status: 'pending_check',
        deforestationScreening: null,
        sinaph: false,
        indigenous: false,
      });
      return;
    }
    const match = findBackendPlotForLocal(plot, backendPlots) as {
      id?: unknown;
      status?: unknown;
      deforestation_screening?: unknown;
      sinaph_overlap?: boolean;
      indigenous_overlap?: boolean;
    } | null;
    setBackendPlotMeta({
      id: match?.id != null ? String(match.id) : null,
      status: match?.status ?? 'pending_check',
      deforestationScreening: match?.deforestation_screening ?? null,
      sinaph: match?.sinaph_overlap === true,
      indigenous: match?.indigenous_overlap === true,
    });
  }, [backendPlots, plot]);

  const refreshTenureVerification = useCallback(async () => {
    if (!backendPlotId) return;
    try {
      const rows = await fetchPlotTenureVerification(backendPlotId);
      setTenureVerifications(rows ?? []);
    } catch {
      setTenureVerifications([]);
    }
  }, [backendPlotId]);

  useEffect(() => {
    void refreshTenureVerification();
  }, [refreshTenureVerification]);

  useEffect(() => {
    if (!backendPlotId) return;
    const hasUploaded =
      evidence.some((e) => e.kind === 'tenure_evidence') || titlePhotos.length > 0;
    const needsPoll =
      hasUploaded &&
      (tenureVerifications.length === 0 ||
        tenureVerifications.some(
          (v) => v.parse_status === 'PENDING' || v.parse_status === 'IN_PROGRESS',
        ));
    if (!needsPoll) return;
    const timer = setInterval(() => {
      void refreshTenureVerification();
    }, 8000);
    return () => clearInterval(timer);
  }, [backendPlotId, evidence, titlePhotos, tenureVerifications, refreshTenureVerification]);

  useEffect(() => {
    if (!farmer?.id) {
      setVouchers([]);
      return;
    }
    fetchVouchersForFarmer(farmer.id)
      .then((rows) => setVouchers(rows ?? []))
      .catch(() => setVouchers([]));
  }, [farmer?.id]);

  useEffect(() => {
    if (typeof sub === 'string') setActive(sub as Sub);
  }, [sub]);

  useEffect(() => {
    if (plot?.name) setRenameDraft(plot.name);
  }, [plot?.id, plot?.name]);

  useEffect(() => {
    if (!plot) {
      setDeclaredHaDraft('');
      return;
    }
    const v = plot.declaredAreaHectares;
    setDeclaredHaDraft(v != null && Number.isFinite(v) ? String(v) : '');
  }, [plot]);

  const showDeclaredFieldInModal = Boolean(
    plot && (plot.kind === 'point' || plot.areaHectares < 4),
  );

  const applyPlotEdit = async () => {
    if (!plot) return;
    const next = renameDraft.trim();
    if (!next) {
      Alert.alert(t('warning'), t('rename_plot_empty'));
      return;
    }
    setNote(null);

    const patch: Partial<Plot> = { name: next };

    if (showDeclaredFieldInModal && declaredHaDraft.trim().length > 0) {
      const parsed = Number(declaredHaDraft.trim().replace(',', '.'));
      if (Number.isNaN(parsed) || parsed <= 0) {
        Alert.alert(t('warning'), t('plot_edit_declared_hint'));
        return;
      }
      if (plot.areaHectares > 0) {
        const diff = Math.abs(plot.areaHectares - parsed);
        const pct = (diff / parsed) * 100;
        if (pct > 5) {
          Alert.alert(t('warning'), t('plot_edit_declared_discrepancy'));
          return;
        }
        patch.declaredAreaHectares = parsed;
        patch.discrepancyPercent = pct;
      } else {
        patch.declaredAreaHectares = parsed;
        patch.discrepancyPercent = undefined;
      }
    } else if (showDeclaredFieldInModal && declaredHaDraft.trim().length === 0) {
      patch.declaredAreaHectares = undefined;
      patch.discrepancyPercent = undefined;
    }

    updatePlot(plot.id, patch);

    if (backendPlotId && farmer?.id) {
      try {
        await updatePlotMetadataOnBackend({
          plotId: backendPlotId,
          name: next,
          reason: t('plot_rename_backend_reason'),
        });
        const rows = await fetchPlotsForFarmer(farmer.id);
        setBackendPlots(rows ?? []);
      } catch {
        setNote(t('plot_rename_local_only'));
      }
    }
    Keyboard.dismiss();
    setRenameModalOpen(false);
  };

  const plotStatusRows = useMemo(() => {
    const evidenceKinds = evidence.map((e) => e.kind);
    const { groundOk, landOk, fpicOk, permitOk, syncOk, tenureParseGate } =
      computePlotReadinessChecklist({
        groundTruthPhotos: photos,
        plot,
        titlePhotoCount: titlePhotos.length,
        evidenceKinds,
        isSyncedToServer: Boolean(backendPlotId),
        tenureVerifications,
        backendFlags:
          backendPlotId != null
            ? {
                sinaph_overlap: overlapFlags.sinaph,
                indigenous_overlap: overlapFlags.indigenous,
              }
            : null,
      });
    const minG = MIN_GROUND_TRUTH_PHOTOS;
    const verifiedGround = plot ? countGeoVerifiedGroundTruthDirections(photos, plot) : 0;

    const blockedVerification = tenureVerifications.find(
      (row) => row.parse_status === 'FAILED' || row.parse_status === 'MANUAL_REQUIRED',
    );
    const landBlockedHint =
      blockedVerification != null
        ? formatTenureVerificationReviewMessage(
            describeTenureVerificationReview(blockedVerification),
            t,
          )
        : t('plot_status_land_parse_blocked');

    const rows: {
      id: string;
      title: string;
      hint: string;
      done: boolean;
      target: SetupTarget | null;
    }[] = [
      {
        id: 'ground',
        title: t('plot_status_ground', { current: verifiedGround, min: minG }),
        hint: t('plot_status_ground_hint'),
        done: groundOk,
        target: 'photos',
      },
      {
        id: 'land',
        title: t('plot_status_land'),
        hint:
          tenureParseGate === 'blocked'
            ? landBlockedHint
            : tenureParseGate === 'pending'
              ? t('plot_status_land_parse_pending')
              : t('plot_status_land_hint'),
        done: landOk,
        target: 'documents',
      },
    ];
    if (overlapFlags.indigenous) {
      rows.push({
        id: 'fpic',
        title: t('plot_status_fpic'),
        hint: t('plot_status_fpic_hint'),
        done: fpicOk,
        target: 'documents',
      });
    }
    if (overlapFlags.sinaph) {
      rows.push({
        id: 'permit',
        title: t('plot_status_permit'),
        hint: t('plot_status_permit_hint'),
        done: permitOk,
        target: 'documents',
      });
    }
    rows.push({
      id: 'sync',
      title: t('plot_status_sync'),
      hint: t('plot_status_sync_hint'),
      done: syncOk,
      target: 'settings',
    });
    return rows;
  }, [
    photos,
    plot,
    titlePhotos.length,
    evidence,
    overlapFlags.indigenous,
    overlapFlags.sinaph,
    backendPlotId,
    tenureVerifications,
    t,
  ]);

  const checklistOpenCount = useMemo(
    () => plotStatusRows.filter((r) => !r.done).length,
    [plotStatusRows],
  );
  const checklistComplete = checklistOpenCount === 0;

  /** Status card lists only incomplete items — what still needs doing. */
  const plotStatusRemainingRows = useMemo(
    () => plotStatusRows.filter((r) => !r.done),
    [plotStatusRows],
  );

  const nextSetupRow = plotStatusRemainingRows[0];

  const harvestPlotId = backendPlotId ?? plot?.id ?? null;

  const harvestPickerPlotId = useMemo(() => {
    if (!plot) return null;
    return resolveHarvestPlotPickerId(plot, backendPlots);
  }, [plot, backendPlots]);

  const plotDeliveryCount = useMemo(() => {
    if (!harvestPlotId) return 0;
    return vouchers.filter((v) => String(v?.plot_id ?? v?.plotId ?? '') === harvestPlotId).length;
  }, [harvestPlotId, vouchers]);

  const plotAreaCaption = useMemo(() => {
    if (!plot) return null;
    const { hectares, source } = resolvePlotAreaHa({
      kind: plot.kind,
      areaHectares: plot.areaHectares,
      declaredAreaHectares: plot.declaredAreaHectares,
    });
    if (hectares <= 0) return null;
    if (source === 'declared') {
      return t('plot_hectares_declared', { n: hectares.toFixed(1) });
    }
    return t('plot_hectares_gps', { n: hectares.toFixed(1) });
  }, [plot, t]);

  const plotHarvestSummary = useMemo(() => {
    if (!plot) {
      return {
        seasonTotalKg: 0,
        rows: [] as { id: string; kg: number; dateLabel: string }[],
      };
    }
    const scoped = harvestPlotId
      ? vouchers.filter((v) => String(v?.plot_id ?? v?.plotId ?? '') === harvestPlotId)
      : [];
    const sorted = [...scoped].sort((a, b) => {
      const at = new Date(String(a?.created_at ?? a?.createdAt ?? 0)).getTime();
      const bt = new Date(String(b?.created_at ?? b?.createdAt ?? 0)).getTime();
      return bt - at;
    });
    const seasonTotalKg = sorted.reduce((sum, v) => {
      const kg = Number(v?.kg ?? v?.kg_delivered ?? v?.weight_kg ?? 0);
      return sum + (Number.isFinite(kg) ? Math.max(0, kg) : 0);
    }, 0);
    const rows = sorted.slice(0, 3).map((v, idx) => {
      const kg = Number(v?.kg ?? v?.kg_delivered ?? v?.weight_kg ?? 0);
      const createdRaw = String(v?.created_at ?? v?.createdAt ?? '');
      const date = createdRaw ? new Date(createdRaw) : null;
      return {
        id: String(v?.id ?? idx),
        kg: Number.isFinite(kg) ? Math.max(0, Math.round(kg)) : 0,
        dateLabel: date
          ? date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })
          : '—',
      };
    });
    return { seasonTotalKg, rows };
  }, [harvestPlotId, plot, vouchers]);

  const openRecordDeliveryForPlot = useCallback(() => {
    if (!harvestPickerPlotId) return;
    router.push(`/(tabs)/harvests?plotId=${encodeURIComponent(harvestPickerPlotId)}&record=1`);
  }, [harvestPickerPlotId]);

  const openNextSetupStep = useCallback(() => {
    if (!nextSetupRow) return;
    if (nextSetupRow.target === 'settings') {
      router.push('/(tabs)/settings?focus=backup');
      return;
    }
    if (nextSetupRow.target) {
      setActive(nextSetupRow.target);
    }
  }, [nextSetupRow]);

  const openSetupRow = useCallback((row: (typeof plotStatusRows)[number]) => {
    if (row.target === 'settings') {
      router.push('/(tabs)/settings?focus=backup');
      return;
    }
    if (row.target) {
      setActive(row.target);
    }
  }, []);

  const notifyDocSync = (message: string, alertTitle?: string, tone: 'success' | 'error' | 'info' = 'error') => {
    setDocSyncMessage(message);
    setDocSyncTone(tone);
    Alert.alert(alertTitle ?? t('plot_documents_legality_sync_button'), message);
  };

  const applyLandTitleUploadOutcome = useCallback(
    (outcome: AutoUploadOutcome, photoCount: number, showAlert = false) => {
      let message: string;
      let tone: 'success' | 'error' | 'info' = 'success';
      switch (outcome.status) {
        case 'uploaded':
          message =
            outcome.uploadedCount > 0
              ? t('plot_documents_auto_upload_ok', { n: outcome.uploadedCount })
              : t('plot_documents_legality_sync_ok');
          break;
        case 'queued':
          message = t('plot_documents_auto_upload_queued');
          tone = 'info';
          break;
        case 'local_only':
          message =
            outcome.reason === 'not_signed_in'
              ? t('plot_documents_auto_upload_local_only')
              : t('plot_documents_land_title_saved_local', { n: photoCount });
          tone = 'info';
          break;
        default:
          return;
      }
      setDocSyncMessage(message);
      setDocSyncTone(tone);
      if (showAlert) {
        Alert.alert(t('evidence_sync_title'), message);
      }
    },
    [t],
  );

  const runLandTitleUpload = useCallback(
    async (photos: PlotTitlePhoto[], showAlert = false) => {
      if (!plot || photos.length === 0) return;
      const outcome = await autoUploadLandTitleDocuments({
        localPlotId: plot.id,
        serverPlotId: backendPlotId,
        farmerId: farmer?.id,
        titlePhotos: photos,
        cadastralKey: cadastralKey.trim() || null,
        informalTenure,
        informalTenureNote: informalTenureNote.trim() || null,
        customReason: legalSyncReason,
      });
      applyLandTitleUploadOutcome(outcome, photos.length, showAlert);
      if (outcome.status === 'uploaded') {
        await refreshTenureVerification();
      }
    },
    [
      applyLandTitleUploadOutcome,
      backendPlotId,
      cadastralKey,
      farmer?.id,
      informalTenure,
      informalTenureNote,
      legalSyncReason,
      plot,
      refreshTenureVerification,
    ],
  );

  const addLandTitlePhoto = async () => {
    if (!plot || addingTitlePhoto) return;
    const file = await pickEvidenceFile({
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
    if (!file) return;
    setAddingTitlePhoto(true);
    try {
      await persistPlotTitlePhoto({
        plotId: plot.id,
        uri: file.uri,
        takenAt: Date.now(),
      });
      const updated = await loadTitlePhotosForPlot(plot.id);
      setTitlePhotos(updated);
      await runLandTitleUpload(updated, false);
    } catch {
      notifyDocSync(t('plot_documents_land_title_save_failed_body'), t('plot_documents_land_title_save_failed'));
    } finally {
      setAddingTitlePhoto(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <LinearGradient
        colors={['#0A7F59', '#0B6F50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRowCompact}>
          <Pressable onPress={() => (active ? setActive(null) : router.back())} style={styles.backPill}>
            <Ionicons name="chevron-back" size={18} color={colors.textInverse} />
            <ThemedText type="caption" style={{ color: colors.textInverse }}>
              {t('back')}
            </ThemedText>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
              {active === 'photos'
                ? t('plot_photo_vault')
                : active === 'documents'
                  ? t('plot_land_documents')
                  : active === 'harvests'
                    ? t('plot_harvest_records')
                    : active === 'voucher'
                      ? t('plot_compliance_voucher')
                      : t('plot_detail_title')}
            </ThemedText>
          </View>
          <Pressable
            onPress={openLanguagePicker}
            accessibilityRole="button"
            accessibilityLabel={t('language_picker_title')}
            style={styles.langPillCompact}
          >
            <ThemedText type="caption" style={{ color: colors.textInverse }}>
              {String(lang).toUpperCase()}
            </ThemedText>
          </Pressable>
        </View>
      </LinearGradient>

      <ThemedScrollView contentContainerStyle={styles.container}>
        {active == null ? (
        <>
        <Card variant="outlined" style={styles.card}>
          {plot ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('plot_map_view_boundary')}
              onPress={() =>
                router.push(`/(tabs)/record?editPlotId=${encodeURIComponent(plot.id)}`)
              }
              style={styles.plotMapHeroPress}
            >
              <PlotMapPreview
                plot={plot}
                region={plotMapRegion}
                offlineTilesEnabled={offlineTilesEnabled}
                offlineTilesPackId={offlineTilesPackId}
                width="100%"
                height={176}
                borderRadius={12}
                showAttribution
              />
              <ThemedText type="caption" style={styles.plotMapCaption}>
                {t('plot_map_view_boundary')}
              </ThemedText>
            </Pressable>
          ) : null}
          <View style={styles.rowHeader}>
            <View style={styles.plotTitleBlock}>
              <ThemedText type="defaultSemiBold" style={styles.plotTitleFull}>
                {plot?.name ?? t('plot_detail_fallback')}
              </ThemedText>
              {plot ? (
                (() => {
                  const hasGpsArea = plot.areaHectares > 0;
                  const dec = plot.declaredAreaHectares;
                  const hasDeclared = dec != null && Number.isFinite(dec);
                  if (hasGpsArea && hasDeclared) {
                    return (
                      <ThemedText type="caption" style={styles.plotHectaresLine}>
                        {`${t('plot_hectares_gps', { n: plot.areaHectares.toFixed(1) })} · ${t(
                          'plot_hectares_declared',
                          { n: dec.toFixed(2) },
                        )}`}
                      </ThemedText>
                    );
                  }
                  if (hasDeclared && !hasGpsArea) {
                    return (
                      <ThemedText type="caption" style={styles.plotHectaresLine}>
                        {t('plot_hectares_declared', { n: dec.toFixed(2) })}
                      </ThemedText>
                    );
                  }
                  return (
                    <ThemedText type="caption" style={styles.plotHectaresLine}>
                      {t('plot_hectares', { n: plot.areaHectares.toFixed(1) })}
                    </ThemedText>
                  );
                })()
              ) : (
                <ThemedText type="caption" style={styles.plotHectaresLine}>
                  —
                </ThemedText>
              )}
            </View>
            {plot ? (
              <Pressable
                onPress={() => {
                  setRenameDraft(plot.name);
                  setRenameModalOpen(true);
                }}
                style={styles.plotRenameBtn}
                accessibilityLabel={t('rename_plot_title')}
                accessibilityRole="button"
              >
                <Ionicons name="create-outline" size={18} color={Brand.primary} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.plotStatusBadgeRow}>
            <Badge variant={checklistComplete ? 'success' : 'warning'} size="sm">
              {checklistComplete ? t('status_compliant') : t('finish_setup_chip')}
            </Badge>
          </View>
          {plot ? (
            <ThemedText type="caption" style={styles.plotRegisteredLine}>
              {t('plot_registered_label')}:{' '}
              {new Date(plot.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              })}
            </ThemedText>
          ) : null}
        </Card>

        {!checklistComplete && nextSetupRow ? (
          <Pressable
            onPress={openNextSetupStep}
            style={({ pressed }) => [styles.nextStepBanner, pressed && styles.nextStepBannerPressed]}
          >
            <View style={styles.nextStepIconWrap}>
              <Ionicons name="arrow-forward-circle" size={28} color="#0A7F59" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="caption" style={styles.nextStepEyebrow}>
                {t('plot_next_step_title')}
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.nextStepTitle}>
                {nextSetupRow.title}
              </ThemedText>
              <ThemedText type="caption" style={styles.nextStepHint}>
                {nextSetupRow.hint}
              </ThemedText>
            </View>
            <ThemedText type="caption" style={styles.nextStepCta}>
              {t('plot_next_step_cta')}
            </ThemedText>
          </Pressable>
        ) : null}

        <Card variant="outlined" style={styles.statusChecklistCard}>
          <View style={styles.progressHeaderRow}>
            <ProgressRing
              progress={
                plotStatusRows.length > 0
                  ? (plotStatusRows.length - checklistOpenCount) / plotStatusRows.length
                  : 0
              }
              centerLabel={`${plotStatusRows.length - checklistOpenCount}/${plotStatusRows.length}`}
            />
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${plotStatusRows.length > 0 ? ((plotStatusRows.length - checklistOpenCount) / plotStatusRows.length) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.progressLabel}>
              {t('plot_progress_label', {
                done: plotStatusRows.length - checklistOpenCount,
                total: plotStatusRows.length,
              })}
            </ThemedText>
          </View>
          <ThemedText type="defaultSemiBold" style={styles.statusChecklistTitle}>
            {t('plot_status_title')}
          </ThemedText>
          {plotStatusRemainingRows.length > 0 ? (
            <>
              <ThemedText type="caption" style={styles.statusChecklistSub}>
                {t('plot_status_subtitle')}
              </ThemedText>
              <View style={styles.statusChecklistRows}>
                {plotStatusRemainingRows.map((row) => (
                  <Pressable
                    key={row.id}
                    disabled={!row.target}
                    onPress={() => openSetupRow(row)}
                    style={({ pressed }) => [
                      styles.statusRow,
                      styles.statusRowOpen,
                      row.target && pressed && styles.statusRowPressed,
                    ]}
                  >
                    <Ionicons name="ellipse-outline" size={22} color="#B45309" />
                    <View style={styles.statusRowBody}>
                      <ThemedText type="defaultSemiBold">{row.title}</ThemedText>
                      <ThemedText type="caption" style={styles.statusRowCaptionOpen}>
                        {row.hint}
                      </ThemedText>
                    </View>
                    {row.target ? (
                      <ThemedText type="caption" style={styles.statusRowTap}>
                        {t('tap_to_open')}
                      </ThemedText>
                    ) : null}
                  </Pressable>
                ))}
              </View>
              <ThemedText type="caption" style={styles.statusRemainingFooterHint}>
                {t('plot_status_remaining_hint')}
              </ThemedText>
            </>
          ) : (
            <View style={styles.statusAllDoneWrap}>
              <Ionicons name="checkmark-circle" size={28} color="#0A7F59" />
              <ThemedText type="default" style={styles.statusAllDoneText}>
                {t('plot_status_all_done')}
              </ThemedText>
            </View>
          )}
        </Card>

        <PlotComplianceStatusCards
          backendPlotId={backendPlotId}
          backendStatus={backendPlotMeta.status}
          deforestationScreening={backendPlotMeta.deforestationScreening}
          sinaphOverlap={overlapFlags.sinaph}
          indigenousOverlap={overlapFlags.indigenous}
        />

        <Pressable style={[styles.navCard, active === 'photos' && styles.navCardSelected]} onPress={() => setActive('photos')}>
          <View style={styles.navIconWrapPhoto}>
            <Ionicons name="camera-outline" size={28} color="#B36A00" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle">{t('plot_nav_photos_title')}</ThemedText>
            <ThemedText type="default">{t('plot_nav_photos_sub', { n: photos.length })}</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#A3A3A3" />
        </Pressable>

        <Pressable
          testID="plot-nav-documents"
          style={[styles.navCard, active === 'documents' && styles.navCardSelected]}
          onPress={() => setActive('documents')}
        >
          <View style={styles.navIconWrapDocs}>
            <Ionicons name="document-text-outline" size={28} color="#2D5FD4" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle">{t('plot_nav_documents_title')}</ThemedText>
            <ThemedText type="default">
              {titlePhotos.length > 0 ? t('plot_nav_documents_sub_done') : t('plot_nav_documents_sub_empty')}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#A3A3A3" />
        </Pressable>

        <Pressable style={[styles.navCard, active === 'harvests' && styles.navCardSelected]} onPress={() => setActive('harvests')}>
          <View style={styles.navIconWrapHarvest}>
            <Ionicons name="scale-outline" size={28} color="#0B6F50" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle">{t('plot_nav_harvests_title')}</ThemedText>
            <ThemedText type="default">{t('plot_nav_harvests_sub', { n: plotDeliveryCount })}</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#A3A3A3" />
        </Pressable>

        <Pressable style={[styles.navCard, active === 'voucher' && styles.navCardSelected]} onPress={() => setActive('voucher')}>
          <View style={styles.navIconWrapVoucher}>
            <Ionicons name="qr-code-outline" size={26} color="#7B2CBF" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle">{t('plot_nav_voucher_title')}</ThemedText>
            <ThemedText type="default">{t('plot_nav_voucher_sub')}</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#A3A3A3" />
        </Pressable>
        </>
        ) : null}

        {active === 'photos' && plot ? (
          <PhotoVaultPanel
            plot={plot}
            photos={photos}
            onPhotosChange={setPhotos}
            t={t}
          />
        ) : null}

        {active === 'documents' && plot ? (
          <>
            <PlotTenureStatusCard
              plot={plot}
              cadastralKey={cadastralKey.trim() || null}
              informalTenure={informalTenure}
              informalTenureNote={informalTenureNote.trim() || null}
              titlePhotoCount={titlePhotos.length}
              tenureEvidenceCount={evidence.filter((e) => e.kind === 'tenure_evidence').length}
              tenureVerifications={tenureVerifications}
              isSyncedToServer={Boolean(backendPlotId)}
            />

            <Card variant="elevated" style={styles.docCard}>
              <ThemedText type="defaultSemiBold">{t('plot_documents_land_title_section')}</ThemedText>
              <ThemedText type="caption" style={{ marginTop: 4 }}>
                {t('plot_documents_land_title_body')}
              </ThemedText>
              <ThemedText type="caption" style={styles.autoUploadBanner}>
                {t('plot_documents_auto_upload_banner')}
              </ThemedText>
              <ThemedText type="caption" style={{ marginTop: 6, opacity: 0.85 }}>
                {t('plot_documents_clave_order_hint')}
              </ThemedText>
              <Input
                label={t('plot_documents_cadastral_label')}
                placeholder={t('plot_documents_cadastral_ph')}
                value={cadastralKey}
                onChangeText={setCadastralKey}
                containerStyle={{ marginTop: 10 }}
              />
              <View style={{ marginTop: 10 }}>
                <Button
                  title={
                    addingTitlePhoto
                      ? t('evidence_sync_busy')
                      : titlePhotos.length > 0
                        ? `${t('plot_documents_add_land_title')} (${titlePhotos.length})`
                        : t('plot_documents_add_land_title')
                  }
                  variant="secondary"
                  disabled={addingTitlePhoto}
                  onPress={() => void addLandTitlePhoto()}
                  testID="plot-add-land-title-photo"
                />
              </View>
              {titlePhotos.length > 0 ? (
                <View style={styles.photoRow} testID="plot-land-title-photo-count">
                  {titlePhotos.slice(0, 4).map((p) => (
                    <Image key={p.id} source={{ uri: p.uri }} style={styles.photoThumb} />
                  ))}
                  {titlePhotos.length > 4 ? (
                    <View style={styles.photoThumbMore}>
                      <ThemedText type="caption">+{titlePhotos.length - 4}</ThemedText>
                    </View>
                  ) : null}
                </View>
              ) : null}
              <Input
                label={t('plot_documents_legality_reason_optional_label')}
                placeholder={t('plot_documents_legality_reason_ph')}
                value={legalSyncReason}
                onChangeText={setLegalSyncReason}
                containerStyle={{ marginTop: 10 }}
              />
              {!backendPlotId && farmer?.id ? (
                <ThemedText type="caption" style={{ marginTop: 10, color: colors.error }}>
                  {t('plot_documents_plot_not_synced_hint')}
                </ThemedText>
              ) : null}
              {titlePhotos.length === 0 ? (
                <ThemedText type="caption" style={{ marginTop: 8, opacity: 0.85 }}>
                  {t('plot_documents_land_title_need_photo')}
                </ThemedText>
              ) : null}
              {docSyncMessage ? (
                <ThemedText
                  type="caption"
                  style={{
                    marginTop: 8,
                    color:
                      docSyncTone === 'success'
                        ? colors.tint
                        : docSyncTone === 'info'
                          ? undefined
                          : colors.error,
                  }}
                >
                  {docSyncMessage}
                </ThemedText>
              ) : null}
            </Card>

            <PlotEvidencePanel
              scopeId={plot.id}
              farmerId={farmer?.id}
              evidence={evidence}
              onEvidenceChange={setEvidence}
              overlapFlags={overlapFlags}
              serverPlotId={backendPlotId}
              showFpicStructured={overlapFlags.indigenous}
              showSync
              onSyncMessage={setDocSyncMessage}
              onSyncComplete={refreshTenureVerification}
            />

          </>
        ) : null}

        {active === 'harvests' ? (
          <>
            {plot ? (
              <View style={{ marginBottom: 12 }}>
                <UiButton variant="primary" fullWidth onPress={openRecordDeliveryForPlot}>
                  {t('plot_harvest_record_delivery')}
                </UiButton>
              </View>
            ) : null}

            <Card variant="outlined" style={styles.harvestSummaryCard}>
              <View style={styles.rowHeader}>
                <ThemedText type="defaultSemiBold" style={styles.harvestSummaryTitle}>
                  {t('plot_harvest_season_total')}
                </ThemedText>
                <ThemedText type="title" style={styles.harvestSummaryKg}>
                  {`${Math.round(plotHarvestSummary.seasonTotalKg).toLocaleString()} kg`}
                </ThemedText>
              </View>
              {plotAreaCaption ? (
                <ThemedText type="caption" style={styles.harvestAreaCaption}>
                  {plotAreaCaption}
                </ThemedText>
              ) : null}
            </Card>

            {plotHarvestSummary.rows.length > 0 ? (
              plotHarvestSummary.rows.map((row) => (
                <Card key={row.id} variant="outlined" style={styles.harvestRowCard}>
                  <View style={styles.rowHeader}>
                    <View>
                      <ThemedText type="title" style={styles.harvestKgText}>{`${row.kg} kg`}</ThemedText>
                      <ThemedText type="default" style={styles.harvestDateText}>
                        {row.dateLabel}
                      </ThemedText>
                    </View>
                    <ThemedText type="subtitle" style={styles.harvestCoopText}>
                      {t('plot_harvest_no_coop')}
                    </ThemedText>
                  </View>
                </Card>
              ))
            ) : (
              <Card variant="outlined" style={styles.harvestRowCard}>
                <ThemedText type="default" style={styles.harvestDateText}>
                  {t('plot_harvest_no_records')}
                </ThemedText>
              </Card>
            )}
          </>
        ) : null}

        {active === 'voucher' ? (
          <>
            {(() => {
              const forPlot = vouchers.filter((v) => {
                const pid = String(v?.plot_id ?? v?.plotId ?? '');
                if (!pid || !backendPlotId) return false;
                return pid === backendPlotId;
              });
              const list = forPlot.length > 0 ? forPlot : vouchers;
              const latest = list[0] ?? null;
              const voucherCode =
                latest?.qr_code_ref
                  ? String(latest.qr_code_ref)
                  : plot
                    ? `HN-COP-${new Date(plot.createdAt).getFullYear()}-001-V`
                    : 'HN-COP-2024-001-V';
              /** Payload encoded in the QR: backend ref when synced, else stable local tracebud URI. */
              const qrPayload =
                latest?.qr_code_ref != null && String(latest.qr_code_ref).trim() !== ''
                  ? String(latest.qr_code_ref).trim()
                  : `tracebud:voucher:${plot?.id ?? 'local'}:${voucherCode}`;
              return (
                <>
                  <Card variant="outlined" style={styles.voucherCard}>
                    <View
                      ref={voucherShareCaptureRef}
                      collapsable={false}
                      style={styles.voucherShareCapture}
                    >
                      <View style={styles.voucherQrWrap}>
                        <View style={styles.voucherQrInner}>
                          <QRCode
                            value={qrPayload}
                            size={176}
                            color="#111111"
                            backgroundColor="#FFFFFF"
                            ecl="M"
                          />
                        </View>
                      </View>
                      <ThemedText type="title" style={styles.voucherTitle}>
                        {t('plot_voucher_title')}
                      </ThemedText>
                      <ThemedText type="default" style={styles.voucherSubtitle}>
                        {t('plot_voucher_subtitle')}
                      </ThemedText>
                      <View style={styles.voucherCodeWrap}>
                        <ThemedText type="defaultSemiBold" style={styles.voucherCodeText}>
                          {voucherCode}
                        </ThemedText>
                      </View>
                    </View>
                  </Card>

                  <ThemedText type="default" style={styles.voucherBodyText}>
                    {t('plot_voucher_body')}
                  </ThemedText>

                  <View style={{ marginTop: 6 }}>
                    <Button
                      title={t('voucher_share')}
                      variant="secondary"
                      style={{ backgroundColor: '#0A9F68' }}
                      loading={voucherShareBusy}
                      disabled={voucherShareBusy}
                      onPress={async () => {
                        const shareMessage = t('voucher_share_message', {
                          code: voucherCode,
                          payload: qrPayload,
                        });
                        setVoucherShareBusy(true);
                        setNote(null);
                        try {
                          if (Platform.OS === 'web') {
                            await Share.share({
                              title: t('voucher_share_title'),
                              message: shareMessage,
                            });
                            return;
                          }
                          await new Promise<void>((resolve) => setTimeout(() => resolve(), 150));
                          const uri = await captureRef(voucherShareCaptureRef, {
                            format: 'png',
                            quality: 0.95,
                            result: 'tmpfile',
                          });
                          const available = await Sharing.isAvailableAsync();
                          if (available && uri) {
                            await Sharing.shareAsync(uri, {
                              mimeType: 'image/png',
                              dialogTitle: t('voucher_share_title'),
                            });
                          } else {
                            await Share.share({
                              title: t('voucher_share_title'),
                              message: shareMessage,
                            });
                          }
                        } catch {
                          try {
                            await Share.share({
                              title: t('voucher_share_title'),
                              message: shareMessage,
                            });
                          } catch {
                            setNote(t('voucher_share_failed'));
                          }
                        } finally {
                          setVoucherShareBusy(false);
                        }
                      }}
                    />
                  </View>
                </>
              );
            })()}
          </>
        ) : null}

        {note ? <ThemedText type="caption">{note}</ThemedText> : null}
      </ThemedScrollView>

      <Modal
        visible={renameModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.renameModalKeyboardRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}
        >
          <Pressable
            style={styles.renameModalBackdrop}
            onPress={() => {
              Keyboard.dismiss();
              setRenameModalOpen(false);
            }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator
              bounces={false}
              style={{ maxHeight: windowHeight * 0.92 }}
              contentContainerStyle={styles.renameModalScrollContent}
            >
              <Pressable style={styles.renameModalCard} onPress={(e) => e.stopPropagation()}>
                <ThemedText type="subtitle">{t('plot_edit_title')}</ThemedText>
                <Input
                  label={t('rename_plot_label')}
                  value={renameDraft}
                  onChangeText={setRenameDraft}
                  containerStyle={{ marginTop: 8 }}
                />
                {showDeclaredFieldInModal ? (
                  <Input
                    label={t('plot_edit_declared_label')}
                    placeholder="e.g. 1.50"
                    keyboardType="decimal-pad"
                    value={declaredHaDraft}
                    onChangeText={setDeclaredHaDraft}
                    containerStyle={{ marginTop: 10 }}
                  />
                ) : null}
                {showDeclaredFieldInModal ? (
                  <ThemedText type="caption" style={{ marginTop: 6, opacity: 0.85 }}>
                    {t('plot_edit_declared_hint')}
                  </ThemedText>
                ) : null}
                {plot ? (
                  <View style={{ marginTop: 14 }}>
                    <UiButton
                      variant="outline"
                      size="md"
                      fullWidth
                      onPress={() => {
                        Keyboard.dismiss();
                        setRenameModalOpen(false);
                        router.push(`/(tabs)/record?editPlotId=${encodeURIComponent(plot.id)}`);
                      }}
                    >
                      {t('plot_edit_redo_boundary')}
                    </UiButton>
                  </View>
                ) : null}
                <View style={styles.renameModalActions}>
                  <View style={{ flex: 1 }}>
                    <UiButton
                      variant="outline"
                      size="md"
                      fullWidth
                      onPress={() => {
                        Keyboard.dismiss();
                        setRenameModalOpen(false);
                      }}
                    >
                      {t('cancel')}
                    </UiButton>
                  </View>
                  <View style={{ flex: 1 }}>
                    <UiButton variant="primary" size="md" fullWidth onPress={() => void applyPlotEdit()}>
                      {t('rename_plot_save')}
                    </UiButton>
                  </View>
                </View>
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 6 },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 4,
  },
  headerRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  langPillCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    minWidth: 54,
    justifyContent: 'center',
  },
  langDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#9FE6C9',
  },
  container: { padding: 16, paddingBottom: 32, gap: 12 },
  card: { marginTop: 2 },
  summaryMetaRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  summaryMetaCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ECECEC',
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  statusChecklistCard: {
    borderRadius: 18,
    borderColor: '#D7DBDF',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 0,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#10B981',
  },
  progressLabel: {
    color: '#0B4F3B',
    fontSize: 13,
    minWidth: 88,
    textAlign: 'right',
  },
  statusChecklistTitle: {
    color: '#0B4F3B',
    fontSize: 16,
  },
  statusChecklistSub: {
    marginTop: 4,
    color: '#5C5C5C',
    lineHeight: 18,
  },
  statusChecklistRows: {
    marginTop: 12,
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECECEC',
    backgroundColor: '#FAFAFA',
  },
  statusRowOpen: {
    borderColor: '#F2C94C',
    backgroundColor: '#FFFBF0',
  },
  statusRowPressed: {
    opacity: 0.92,
  },
  statusRowBody: {
    flex: 1,
    flexShrink: 1,
  },
  statusRowCaptionOpen: {
    marginTop: 4,
    color: '#6B6B6B',
    lineHeight: 18,
  },
  statusRowTap: {
    color: Brand.primary,
    alignSelf: 'center',
    fontWeight: '600',
  },
  statusRemainingFooterHint: {
    marginTop: 10,
    color: '#6B7280',
    lineHeight: 18,
  },
  statusAllDoneWrap: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  statusAllDoneText: {
    flex: 1,
    color: '#0A7F59',
    fontWeight: '600',
    lineHeight: 22,
  },
  checkCard: {
    borderRadius: 18,
    borderColor: '#AEE6D3',
    backgroundColor: '#DDEFE8',
  },
  checkIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#BFEEDB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCard: {
    borderWidth: 1,
    borderColor: '#D7DBDF',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navCardSelected: {
    borderColor: '#74D7B8',
  },
  navIconWrapPhoto: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F8F1CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapDocs: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#DFEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapHarvest: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#DDF5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapVoucher: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EFE3FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIntroCard: {
    borderRadius: 18,
    borderColor: '#AEE6D3',
    backgroundColor: '#DDEFE8',
  },
  photoIntroText: {
    color: '#1E6D58',
  },
  photoVaultGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoVaultSlot: {
    width: '48.5%',
    minHeight: 210,
    borderRadius: 16,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  photoVaultImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  photoVaultTitle: {
    color: '#666666',
  },
  photoVaultDate: {
    color: '#8E8E8E',
  },
  docCard: {
    borderRadius: 20,
    backgroundColor: '#F6F6F6',
    borderColor: '#D9D9D9',
    padding: 18,
  },
  autoUploadBanner: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    color: '#047857',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIconWrapGreen: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#D3EFE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIconWrapBlue: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#DBE8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docVerifiedText: {
    color: '#0A7F59',
  },
  docPendingText: {
    color: '#B87700',
  },
  docCodeWrap: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: '#EBEBEB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  docCodeText: {
    color: '#4F4F4F',
  },
  docSubText: {
    marginTop: 10,
    color: '#676767',
  },
  uploadDocCta: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#7CD8BA',
    borderStyle: 'dashed',
    backgroundColor: '#DDEFE8',
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  uploadDocText: {
    color: '#0A7F59',
  },
  harvestSummaryCard: {
    borderRadius: 20,
    backgroundColor: '#F7F7F7',
    borderColor: '#D9D9D9',
  },
  harvestSummaryTitle: {
    color: '#3A3A3A',
  },
  harvestSummaryKg: {
    color: '#0A7F59',
  },
  harvestAreaCaption: {
    marginTop: 6,
    color: '#565656',
  },
  harvestRowCard: {
    borderRadius: 18,
    backgroundColor: '#F7F7F7',
    borderColor: '#D9D9D9',
    paddingVertical: 16,
  },
  harvestKgText: {
    color: '#1F1F1F',
  },
  harvestDateText: {
    color: '#616161',
  },
  harvestCoopText: {
    color: '#616161',
  },
  voucherCard: {
    borderRadius: 22,
    backgroundColor: '#F7F7F7',
    borderColor: '#D9D9D9',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 20,
  },
  voucherShareCapture: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  voucherQrWrap: {
    width: 192,
    height: 192,
    borderRadius: 18,
    backgroundColor: '#E7E7E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  voucherQrInner: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  voucherTitle: {
    color: '#1F1F1F',
  },
  voucherSubtitle: {
    color: '#6C6C6C',
    marginTop: 2,
  },
  voucherCodeWrap: {
    marginTop: 12,
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#DDEFE8',
    paddingVertical: 10,
    alignItems: 'center',
  },
  voucherCodeText: {
    color: '#0A7F59',
  },
  voucherBodyText: {
    marginTop: 14,
    color: '#515151',
    lineHeight: 30,
  },
  rowCard: { padding: 12 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  plotTitleBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  plotTitleFull: {
    color: '#111111',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  plotHectaresLine: {
    marginTop: 4,
    maxWidth: '100%',
    fontSize: 13,
    lineHeight: 18,
    color: '#3D3D3D',
  },
  plotStatusBadgeRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  plotRegisteredLine: {
    marginTop: 8,
    color: '#6B7280',
  },
  nextStepBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#AEE6D3',
    backgroundColor: '#E8F7F0',
    marginBottom: 4,
  },
  nextStepBannerPressed: {
    opacity: 0.92,
  },
  nextStepIconWrap: {
    width: 36,
    alignItems: 'center',
  },
  nextStepEyebrow: {
    color: '#0A7F59',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  nextStepTitle: {
    marginTop: 2,
    color: '#0B4F3B',
    fontSize: 16,
  },
  nextStepHint: {
    marginTop: 4,
    color: '#1F6B57',
    lineHeight: 18,
  },
  nextStepCta: {
    color: '#0A7F59',
    fontWeight: '700',
    maxWidth: 72,
    textAlign: 'right',
  },
  plotRenameBtn: {
    padding: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#AEE6D3',
    backgroundColor: '#E8F8F1',
    marginTop: 2,
    flexShrink: 0,
  },
  plotMapHeroPress: {
    marginBottom: 14,
  },
  plotMapCaption: {
    marginTop: 8,
    color: '#0A7F59',
    textAlign: 'center',
    fontWeight: '600',
  },
  renameModalKeyboardRoot: {
    flex: 1,
  },
  renameModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  renameModalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  renameModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  renameModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  photoThumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#eee' },
  photoThumbMore: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});


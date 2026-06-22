import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { deliveryReceiptHref } from '@/features/navigation/receiptRoutes';
import { useFocusEffect } from '@react-navigation/native';
import { PhotoVaultPanel } from '@/components/plot-photo-vault/PhotoVaultPanel';
import { DeliveryReceiptsBrowser } from '@/components/harvest/DeliveryReceiptsBrowser';
import type { HarvestPlotOption } from '@/features/harvest/multiPlotDeliverySession';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Badge } from '@/components/ui/badge';
import { Button as UiButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppState, type Plot } from '@/features/state/AppStateContext';
import { subscribeServerPlotSyncChanged } from '@/features/sync/plotServerSync';
import { getPlotUploadGeometryBlock } from '@/features/sync/plotSyncPending';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  fetchPlotTenureVerification,
  fetchPlotsForFarmer,
  fetchVouchersForFarmer,
  type PlotTenureVerificationRecord,
} from '@/features/api/postPlot';
import {
  loadPhotosForPlot,
  loadPlotCadastralKey,
  loadPlotTenure,
  loadTitlePhotosForPlot,
  loadEvidenceForPlot,
  deletePlotTitlePhoto,
  deletePlotEvidenceItem,
  getSetting,
  loadPlotServerLinks,
  loadPendingSyncActions,
  loadLocalDeliveryReceiptsForFarmer,
  persistPlotServerLinks,
  type PlotPhoto,
  type PlotTitlePhoto,
  type PlotEvidenceItem,
} from '@/features/state/persistence';
import { PlotEvidencePanel } from '@/components/evidence/PlotEvidencePanel';
import { DocumentPreviewModal } from '@/components/evidence/DocumentPreviewModal';
import { PlotLandPapersCard } from '@/components/evidence/PlotLandPapersCard';
import { PlotTenureStatusCard } from '@/components/compliance/PlotTenureStatusCard';
import { PlotComplianceStatusCards } from '@/components/compliance/PlotComplianceStatusCards';
import { PlotMapPreview } from '@/components/plot-map/PlotMapPreview';
import { producerEvidenceScopeId } from '@/features/evidence/evidenceScope';
import { hasProducerAttestationsComplete } from '@/features/compliance/farmerDeclarations';
import type { DocumentPreviewItem } from '@/features/evidence/documentPreview';
import { formatPlotDocumentsNavSubtitle } from '@/features/evidence/plotDocumentSummary';
import { pickAndSaveLandProof } from '@/features/evidence/saveLandProof';
import {
  autoUploadLandTitleDocuments,
  autoUploadPlotEvidenceDocuments,
  type AutoUploadOutcome,
} from '@/features/evidence/autoUploadPlotDocuments';
import { filterTenureVerificationsForLocalLandDocs } from '@/features/compliance/filterTenureVerificationsForLocalDocs';
import {
  MIN_GROUND_TRUTH_PHOTOS,
  computePlotReadinessChecklist,
  resolveLandDocumentsUiStatus,
} from '@/features/compliance/plotChecklist';
import {
  isTenureVerificationAwaitingReview,
  resolvePlotLandBlockedShortHint,
  tenureVerificationRequiresReupload,
} from '@/features/compliance/plotTenureVerificationReview';
import { countGeoVerifiedGroundTruthDirections } from '@/features/compliance/groundTruthPhotoGeo';
import { resolveServerPlotIdForLocal, reconcilePlotServerLinks, type PlotServerLinks } from '@/features/plots/plotServerLink';
import { resolveHarvestPlotPickerId, resolveLocalPlotForHarvestSubmit } from '@/features/harvest/mergeHarvestPlotOptions';
import {
  normalizePendingHarvestReceipts,
  type DeliveryReceiptRecord,
} from '@/features/harvest/deliveryReceiptModels';
import {
  normalizeLocalDeliveryReceipts,
  receiptMatchesPlotFilter,
  resolvePlotReceiptFilterIds,
} from '@/features/harvest/localDeliveryReceipts';
import { normalizeVoucherRows } from '@/features/harvest/normalizeVoucherRows';
import { resolvePlotAreaHa } from '@/features/harvest/plotYieldCapacity';
import { computeRegionFromPlot } from '@/features/mapping/plotMapRegion';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { createPlotDetailScreenStyles } from '@/app/plot/plotDetailScreenStyles';

type Sub = 'photos' | 'documents' | 'deliveries';
type SetupTarget = Sub | 'settings';

export default function PlotDetailScreen() {
  const styles = useThemedStyles(createPlotDetailScreenStyles);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { id, sub, from, receiptId } = useLocalSearchParams<{
    id: string;
    sub?: Sub | 'harvests' | 'voucher';
    from?: string;
    receiptId?: string;
  }>();
  const { plots, farmer, updatePlot, removePlot } = useAppState();
  const { t, lang, openLanguagePicker } = useLanguage();

  const plotId = typeof id === 'string' ? id : '';
  const receiptRedirectRef = useRef(false);
  const [plotServerLinks, setPlotServerLinks] = useState<PlotServerLinks>({});

  const [active, setActive] = useState<Sub | null>((sub as Sub) ?? null);
  const [photos, setPhotos] = useState<PlotPhoto[]>([]);
  const [titlePhotos, setTitlePhotos] = useState<PlotTitlePhoto[]>([]);
  const [evidence, setEvidence] = useState<PlotEvidenceItem[]>([]);
  const [producerEvidenceKinds, setProducerEvidenceKinds] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [pendingHarvestReceipts, setPendingHarvestReceipts] = useState<DeliveryReceiptRecord[]>([]);
  const [deviceHarvestReceipts, setDeviceHarvestReceipts] = useState<DeliveryReceiptRecord[]>([]);
  const [backendPlots, setBackendPlots] = useState<any[]>([]);
  const plot = useMemo(() => {
    const direct = plots.find((p) => p.id === plotId) ?? null;
    if (direct || !plotId) return direct;
    return resolveLocalPlotForHarvestSubmit({
      selectedPlotId: plotId,
      localPlots: plots,
      backendPlots,
      plotServerLinks,
    });
  }, [plots, plotId, backendPlots, plotServerLinks]);
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
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [declaredHaDraft, setDeclaredHaDraft] = useState('');
  const [cadastralKey, setCadastralKey] = useState('');
  const [informalTenure, setInformalTenure] = useState(false);
  const [informalTenureNote, setInformalTenureNote] = useState('');
  const [docSyncMessage, setDocSyncMessage] = useState<string | null>(null);
  const [docSyncTone, setDocSyncTone] = useState<'success' | 'error' | 'info'>('info');
  const [docPreviewItem, setDocPreviewItem] = useState<DocumentPreviewItem | null>(null);
  const [uploadingLandProof, setUploadingLandProof] = useState(false);
  const [landPapersExpanded, setLandPapersExpanded] = useState(false);
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
    const resolvedPlotId = plot?.id ?? plotId;
    if (!resolvedPlotId) return;
    loadPhotosForPlot(resolvedPlotId).then(setPhotos).catch(() => setPhotos([]));
    loadTitlePhotosForPlot(resolvedPlotId).then(setTitlePhotos).catch(() => setTitlePhotos([]));
    loadEvidenceForPlot(resolvedPlotId).then(setEvidence).catch(() => setEvidence([]));
    loadPlotCadastralKey(resolvedPlotId)
      .then((key) => setCadastralKey(key ?? ''))
      .catch(() => setCadastralKey(''));
    loadPlotTenure(resolvedPlotId)
      .then((row) => {
        setInformalTenure(row.informalTenure);
        setInformalTenureNote(row.informalTenureNote ?? '');
      })
      .catch(() => {
        setInformalTenure(false);
        setInformalTenureNote('');
      });
  }, [plot?.id, plotId]);

  useEffect(() => {
    if (!farmer?.id) {
      setProducerEvidenceKinds([]);
      return;
    }
    loadEvidenceForPlot(producerEvidenceScopeId(farmer.id))
      .then((rows) =>
        setProducerEvidenceKinds(
          rows.map((row) => row.kind).filter((kind) => typeof kind === 'string' && kind.length > 0),
        ),
      )
      .catch(() => setProducerEvidenceKinds([]));
  }, [farmer?.id]);

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
      .then(async (rows) => {
        const links = await loadPlotServerLinks();
        const reconciled = reconcilePlotServerLinks(plots, rows ?? [], links);
        await persistPlotServerLinks(reconciled);
        setPlotServerLinks(reconciled);
        setBackendPlots(rows ?? []);
      })
      .catch((err) => {
        setBackendPlots([]);
        setBackendError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoadingBackend(false));
  }, [farmer?.id, plots]);

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
    void loadPlotServerLinks().then((links) => {
      const serverId = resolveServerPlotIdForLocal(plot, backendPlots, links);
      const match = serverId
        ? (backendPlots as {
            id?: unknown;
            status?: unknown;
            deforestation_screening?: unknown;
            sinaph_overlap?: boolean;
            indigenous_overlap?: boolean;
          }[]).find((row) => String(row?.id ?? '') === serverId)
        : null;
      setBackendPlotMeta({
        id: serverId,
        status: match?.status ?? 'pending_check',
        deforestationScreening: match?.deforestation_screening ?? null,
        sinaph: match?.sinaph_overlap === true,
        indigenous: match?.indigenous_overlap === true,
      });
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

  useFocusEffect(
    useCallback(() => {
      void refreshTenureVerification();
    }, [refreshTenureVerification]),
  );

  useEffect(() => {
    return subscribeServerPlotSyncChanged(() => {
      void refreshTenureVerification();
    });
  }, [refreshTenureVerification]);

  useEffect(() => {
    if (!backendPlotId) return;
    const hasUploaded =
      evidence.some((e) => e.kind === 'tenure_evidence') || titlePhotos.length > 0;
    const needsPoll =
      hasUploaded &&
      tenureVerifications.length > 0 &&
      tenureVerifications.some(isTenureVerificationAwaitingReview);
    if (!needsPoll) return;
    const timer = setInterval(() => {
      void refreshTenureVerification();
    }, 8000);
    return () => clearInterval(timer);
  }, [backendPlotId, evidence, titlePhotos, tenureVerifications, refreshTenureVerification]);

  const refreshVoucherReceipts = useCallback(async () => {
    if (!farmer?.id) {
      setVouchers([]);
      setPendingHarvestReceipts([]);
      setDeviceHarvestReceipts([]);
      return;
    }

    const routePlotId = plotId?.trim() || null;
    const resolvedPlot =
      plot ??
      (routePlotId
        ? resolveLocalPlotForHarvestSubmit({
            selectedPlotId: routePlotId,
            localPlots: plots,
            backendPlots,
            plotServerLinks,
          })
        : null);

    try {
      const links = await loadPlotServerLinks();
      const serverPlotId = resolvedPlot
        ? resolveServerPlotIdForLocal(resolvedPlot, backendPlots, links)
        : null;
      const plotIds = new Set(
        resolvePlotReceiptFilterIds({
          localPlotId: resolvedPlot?.id ?? routePlotId,
          serverPlotId,
          plotServerLinks: links,
        }),
      );
      if (plotIds.size === 0 && routePlotId) {
        plotIds.add(routePlotId);
      }

      const [voucherPayload, pendingActions, localRows] = await Promise.all([
        fetchVouchersForFarmer(farmer.id).catch(() => []),
        loadPendingSyncActions(),
        loadLocalDeliveryReceiptsForFarmer(farmer.id),
      ]);
      setVouchers(normalizeVoucherRows(voucherPayload));

      const plotName = String(resolvedPlot?.name ?? t('plot_fallback'));
      const groupPlotId = serverPlotId ?? resolvedPlot?.id ?? routePlotId ?? 'unknown';

      setDeviceHarvestReceipts(
        normalizeLocalDeliveryReceipts(
          localRows.filter(
            (row) =>
              plotIds.has(row.localPlotId) ||
              (row.serverPlotId != null && plotIds.has(row.serverPlotId)),
          ),
          t,
        ),
      );
      setPendingHarvestReceipts(
        normalizePendingHarvestReceipts({
          actions: pendingActions.filter((action) => action.actionType === 'harvest'),
          plotIds,
          groupPlotId,
          plotName,
          t,
        }),
      );
    } catch {
      setVouchers([]);
      setPendingHarvestReceipts([]);
      setDeviceHarvestReceipts([]);
    }
  }, [backendPlots, farmer?.id, plot, plotId, plots, plotServerLinks, t]);

  useEffect(() => {
    void refreshVoucherReceipts();
  }, [refreshVoucherReceipts]);

  useFocusEffect(
    useCallback(() => {
      if (active !== 'deliveries') return;
      void refreshVoucherReceipts();
    }, [active, refreshVoucherReceipts]),
  );

  useEffect(() => {
    const receiptIdParam = typeof receiptId === 'string' ? receiptId.trim() : '';
    if (receiptIdParam) {
      if (receiptRedirectRef.current) return;
      receiptRedirectRef.current = true;
      router.replace(
        deliveryReceiptHref(receiptIdParam, from === 'harvests' ? { from: 'harvests' } : undefined),
      );
      return;
    }
    receiptRedirectRef.current = false;

    if (typeof sub !== 'string') return;

    const nextActive: Sub =
      sub === 'harvests' || sub === 'voucher' ? 'deliveries' : (sub as Sub);
    setActive((prev) => (prev === nextActive ? prev : nextActive));
  }, [sub, plotId, receiptId, from]);

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

    Keyboard.dismiss();
    setRenameModalOpen(false);
  };

  const tenureEvidenceItems = useMemo(
    () => evidence.filter((item) => item.kind === 'tenure_evidence'),
    [evidence],
  );

  const visibleTenureVerifications = useMemo(
    () =>
      filterTenureVerificationsForLocalLandDocs(
        tenureVerifications,
        titlePhotos,
        tenureEvidenceItems,
      ),
    [tenureVerifications, titlePhotos, tenureEvidenceItems],
  );

  const producerFpicCount = useMemo(
    () => producerEvidenceKinds.filter((kind) => kind === 'fpic_repository').length,
    [producerEvidenceKinds],
  );
  const producerAttestationsComplete = useMemo(
    () => hasProducerAttestationsComplete(farmer),
    [farmer],
  );

  const plotStatusRows = useMemo(() => {
    const evidenceKinds = evidence.map((e) => e.kind);
    const { groundOk, fpicOk, permitOk, syncOk, tenureParseGate } =
      computePlotReadinessChecklist({
        groundTruthPhotos: photos,
        plot,
        titlePhotoCount: titlePhotos.length,
        evidenceKinds,
        producerEvidenceKinds,
        producerAttestationsComplete,
        isSyncedToServer: Boolean(backendPlotId),
        tenureVerifications: visibleTenureVerifications,
        backendFlags:
          backendPlotId != null
            ? {
                sinaph_overlap: overlapFlags.sinaph,
                indigenous_overlap: overlapFlags.indigenous,
              }
            : null,
      });
    const landDocumentsUiStatus = resolveLandDocumentsUiStatus({
      titlePhotoCount: titlePhotos.length,
      evidenceKinds,
      tenureParseGate,
    });
    const landDocCount =
      titlePhotos.length + evidence.filter((e) => e.kind === 'tenure_evidence').length;
    const minG = MIN_GROUND_TRUTH_PHOTOS;
    const verifiedGround = plot ? countGeoVerifiedGroundTruthDirections(photos, plot) : 0;

    const blockedVerification = visibleTenureVerifications.find(
      (row) => row.parse_status === 'FAILED' || row.parse_status === 'MANUAL_REQUIRED',
    );
    const landBlockedHint = resolvePlotLandBlockedShortHint(blockedVerification, t);

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
          landDocumentsUiStatus === 'blocked'
            ? landBlockedHint
            : landDocumentsUiStatus === 'reviewing'
              ? t('plot_status_land_parse_pending')
              : landDocumentsUiStatus === 'awaiting_upload'
                ? t('plot_status_land_awaiting_upload')
              : landDocumentsUiStatus === 'local_only'
                ? t('plot_nav_documents_sub_on_phone', { n: landDocCount })
                : t('plot_status_land_hint'),
        done: landDocumentsUiStatus === 'verified',
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
    producerEvidenceKinds,
    producerAttestationsComplete,
    overlapFlags.indigenous,
    overlapFlags.sinaph,
    backendPlotId,
    visibleTenureVerifications,
    t,
  ]);

  const checklistOpenCount = useMemo(
    () => plotStatusRows.filter((r) => !r.done).length,
    [plotStatusRows],
  );
  const checklistComplete = checklistOpenCount === 0;
  const uploadGeometryBlock = useMemo(
    () => (plot ? getPlotUploadGeometryBlock(plot, plots, t) : null),
    [plot, plots, t],
  );
  const needsBoundaryFix = uploadGeometryBlock != null;

  /** Status card lists only incomplete items — what still needs doing. */
  const plotStatusRemainingRows = useMemo(
    () => plotStatusRows.filter((r) => !r.done),
    [plotStatusRows],
  );

  const nextSetupRow = plotStatusRemainingRows[0];

  const nextDocumentStep = useMemo(
    () => plotStatusRows.find((r) => !r.done && (r.id === 'land' || r.id === 'fpic' || r.id === 'permit')),
    [plotStatusRows],
  );

  const landChecklistDone = useMemo(
    () => plotStatusRows.find((r) => r.id === 'land')?.done ?? false,
    [plotStatusRows],
  );

  useEffect(() => {
    if (!landChecklistDone) setLandPapersExpanded(false);
  }, [landChecklistDone]);

  useEffect(() => {
    if (visibleTenureVerifications.some((row) => tenureVerificationRequiresReupload(row))) {
      setLandPapersExpanded(true);
    }
  }, [visibleTenureVerifications]);

  const documentsNavSubtitle = useMemo(() => {
    if (!plot) return t('plot_nav_documents_sub_empty');
    const evidenceKinds = evidence.map((e) => e.kind);
    const checklist = computePlotReadinessChecklist({
      groundTruthPhotos: photos,
      plot,
      titlePhotoCount: titlePhotos.length,
      evidenceKinds,
      producerEvidenceKinds,
      producerAttestationsComplete,
      isSyncedToServer: Boolean(backendPlotId),
      tenureVerifications: visibleTenureVerifications,
      backendFlags:
        backendPlotId != null
          ? {
              sinaph_overlap: overlapFlags.sinaph,
              indigenous_overlap: overlapFlags.indigenous,
            }
          : null,
    });
    return formatPlotDocumentsNavSubtitle(
      checklist,
      { titlePhotos: titlePhotos.length, evidenceCount: evidence.length },
      t,
    );
  }, [
    plot,
    photos,
    titlePhotos.length,
    evidence,
    producerEvidenceKinds,
    producerAttestationsComplete,
    backendPlotId,
    visibleTenureVerifications,
    overlapFlags.sinaph,
    overlapFlags.indigenous,
    t,
  ]);

  const harvestPlotId = backendPlotId ?? plot?.id ?? null;

  const plotReceiptFilterIds = useMemo(
    () =>
      resolvePlotReceiptFilterIds({
        localPlotId: plot?.id,
        serverPlotId: harvestPlotId,
        plotServerLinks,
      }),
    [plot?.id, harvestPlotId, plotServerLinks],
  );

  const harvestPickerPlotId = useMemo(() => {
    if (!plot) return null;
    return resolveHarvestPlotPickerId(plot, backendPlots);
  }, [plot, backendPlots]);

  const plotDeliveryCount = useMemo(() => {
    if (plotReceiptFilterIds.length === 0) return 0;
    const filterIds = new Set(plotReceiptFilterIds);
    const localCount = deviceHarvestReceipts.filter((row) =>
      receiptMatchesPlotFilter(row, filterIds),
    ).length;
    const pendingCount = pendingHarvestReceipts.filter((row) =>
      receiptMatchesPlotFilter(row, filterIds),
    ).length;
    const voucherCount = harvestPlotId
      ? vouchers.filter((v) => String(v?.plot_id ?? v?.plotId ?? '') === harvestPlotId).length
      : 0;
    return Math.max(localCount + pendingCount, voucherCount);
  }, [
    deviceHarvestReceipts,
    harvestPlotId,
    pendingHarvestReceipts,
    plotReceiptFilterIds,
    vouchers,
  ]);

  const harvestPlotOptions = useMemo((): HarvestPlotOption[] => {
    if (!plot || !harvestPlotId) return [];
    const { hectares } = resolvePlotAreaHa({
      kind: plot.kind,
      areaHectares: plot.areaHectares,
      declaredAreaHectares: plot.declaredAreaHectares,
    });
    return [
      {
        id: harvestPlotId,
        name: String(plot.name ?? ''),
        area_ha: hectares,
        localOnly: !backendPlotId,
      },
    ];
  }, [plot, harvestPlotId, backendPlotId]);

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

  const notifyDocSync = useCallback((message: string, tone: 'success' | 'error' | 'info' = 'error') => {
    setDocSyncMessage(message);
    setDocSyncTone(tone);
  }, []);

  const applyLandTitleUploadOutcome = useCallback(
    (outcome: AutoUploadOutcome, photoCount: number, showAlert = false) => {
      let message: string;
      let tone: 'success' | 'error' | 'info' = 'success';
      switch (outcome.status) {
        case 'uploaded':
          message =
            outcome.uploadedCount > 0
              ? t('plot_documents_auto_upload_ok', { n: outcome.uploadedCount })
              : t('plot_documents_auto_upload_queued');
          tone = outcome.uploadedCount > 0 ? 'success' : 'info';
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
      plot,
      refreshTenureVerification,
    ],
  );

  const uploadLandProof = useCallback(async () => {
    if (!plot || uploadingLandProof) return;
    setUploadingLandProof(true);
    try {
      const result = await pickAndSaveLandProof({
        plotId: plot.id,
        pickMessages: {
          pick_source_title: t('plot_land_papers_pick_title'),
          pick_source_body: t('plot_land_papers_pick_body'),
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
        },
      });
      if (!result) return;

      setTitlePhotos(result.titlePhotos);
      setEvidence(result.evidence);

      if (result.kind === 'photo') {
        try {
          await runLandTitleUpload(result.titlePhotos, false);
        } catch {
          notifyDocSync(
            t('plot_documents_land_title_save_failed_body'),
            'error',
          );
        }
        return;
      }

      const tenureItems = result.evidence.filter((row) => row.kind === 'tenure_evidence');
      if (tenureItems.length === 0) {
        setDocSyncMessage(t('plot_documents_evidence_saved_local', { n: 0 }));
        setDocSyncTone('info');
        return;
      }

      try {
        const outcome = await autoUploadPlotEvidenceDocuments({
          localPlotId: plot.id,
          serverPlotId: backendPlotId,
          farmerId: farmer?.id,
          items: tenureItems,
        });
        applyLandTitleUploadOutcome(outcome, tenureItems.length, false);
        if (outcome.status === 'uploaded') {
          await refreshTenureVerification();
        }
      } catch {
        notifyDocSync(t('plot_documents_land_title_save_failed_body'), 'error');
      }
    } catch {
      notifyDocSync(t('plot_documents_land_title_save_failed_body'), 'error');
    } finally {
      setUploadingLandProof(false);
    }
  }, [
    applyLandTitleUploadOutcome,
    backendPlotId,
    farmer?.id,
    notifyDocSync,
    plot,
    refreshTenureVerification,
    runLandTitleUpload,
    t,
    uploadingLandProof,
  ]);

  const confirmDeleteLandDocument = useCallback(
    (onConfirm: () => void) => {
      Alert.alert(t('delete_land_document_title'), t('delete_land_document_body'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: onConfirm },
      ]);
    },
    [t],
  );

  const removeLandTitlePhoto = useCallback(
    async (photo: PlotTitlePhoto) => {
      if (!plot) return;
      await deletePlotTitlePhoto(photo.id);
      const [nextPhotos, nextEvidence] = await Promise.all([
        loadTitlePhotosForPlot(plot.id),
        loadEvidenceForPlot(plot.id),
      ]);
      setTitlePhotos(nextPhotos);
      setEvidence(nextEvidence);
      setDocPreviewItem((prev) =>
        prev?.deleteTarget?.kind === 'land_title_photo' && prev.deleteTarget.id === photo.id
          ? null
          : prev,
      );
      notifyDocSync(t('plot_land_document_removed'), 'info');
      if (nextPhotos.length > 0) {
        await runLandTitleUpload(nextPhotos, false);
      } else {
        await refreshTenureVerification();
      }
    },
    [plot, runLandTitleUpload, refreshTenureVerification, notifyDocSync, t],
  );

  const replaceLandPaper = useCallback(async () => {
    if (!plot || uploadingLandProof) return;
    setLandPapersExpanded(true);
    const needsReplace = visibleTenureVerifications.some((row) =>
      tenureVerificationRequiresReupload(row),
    );
    if (needsReplace && titlePhotos.length === 1) {
      await removeLandTitlePhoto(titlePhotos[0]!);
    }
    await uploadLandProof();
  }, [
    plot,
    uploadingLandProof,
    visibleTenureVerifications,
    titlePhotos,
    removeLandTitlePhoto,
    uploadLandProof,
  ]);

  const removeTenureEvidence = useCallback(
    async (item: PlotEvidenceItem) => {
      if (!plot) return;
      await deletePlotEvidenceItem(item.id);
      const nextEvidence = await loadEvidenceForPlot(plot.id);
      setEvidence(nextEvidence);
      setDocPreviewItem((prev) =>
        prev?.deleteTarget?.kind === 'tenure_evidence' && prev.deleteTarget.id === item.id
          ? null
          : prev,
      );
      notifyDocSync(t('plot_land_document_removed'), 'info');
      const remaining = nextEvidence.filter((row) => row.kind === 'tenure_evidence');
      if (remaining.length > 0 && backendPlotId && farmer?.id) {
        const outcome = await autoUploadPlotEvidenceDocuments({
          localPlotId: plot.id,
          serverPlotId: backendPlotId,
          farmerId: farmer.id,
          items: remaining,
        });
        if (outcome.status === 'uploaded') {
          await refreshTenureVerification();
        }
      } else {
        await refreshTenureVerification();
      }
    },
    [plot, backendPlotId, farmer?.id, refreshTenureVerification, notifyDocSync, t],
  );

  const handleHeaderBack = useCallback(() => {
    if (from === 'documents' && active === 'documents') {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/documents');
      }
      return;
    }
    if (from === 'harvests' && active === 'deliveries') {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/harvests');
      }
      return;
    }
    if (active) {
      setActive(null);
      return;
    }
    router.back();
  }, [active, from]);

  const confirmDeletePlot = useCallback(() => {
    if (!plot) return;
    Alert.alert(
      t('delete_plot_title'),
      t('delete_plot_confirm_body', {
        name: plot.name,
        photos: photos.length,
        deliveries: plotDeliveryCount,
      }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete_plot_confirm_continue'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('delete_plot_final_title'),
              t('delete_plot_final_body', { name: plot.name }),
              [
                { text: t('cancel'), style: 'cancel' },
                {
                  text: t('delete'),
                  style: 'destructive',
                  onPress: () => {
                    removePlot(plot.id);
                    router.replace('/(tabs)/explore');
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [plot, photos.length, plotDeliveryCount, removePlot, t]);

  return (
    <ThemedView style={styles.screen}>
      <LinearGradient
        colors={[colors.link, colors.linkStrong]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRowCompact}>
          <Pressable onPress={handleHeaderBack} style={styles.backPill}>
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
                  : active === 'deliveries'
                      ? t('plot_nav_deliveries_title')
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
            <Badge
              variant={needsBoundaryFix ? 'error' : checklistComplete ? 'success' : 'warning'}
              size="sm"
            >
              {needsBoundaryFix
                ? t('plot_needs_boundary_fix')
                : checklistComplete
                  ? t('status_compliant')
                  : t('finish_setup_chip')}
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
              <Ionicons name="arrow-forward-circle" size={28} color={colors.link} />
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
                    <Ionicons name="ellipse-outline" size={22} color={colors.textWarningStrong} />
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
              <Ionicons name="checkmark-circle" size={28} color={colors.link} />
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
            <Ionicons name="camera-outline" size={28} color={colors.textWarningStrong} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle">{t('plot_nav_photos_title')}</ThemedText>
            <ThemedText type="default">{t('plot_nav_photos_sub', { n: photos.length })}</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.iconMuted} />
        </Pressable>

        <Pressable
          testID="plot-nav-documents"
          style={[styles.navCard, active === 'documents' && styles.navCardSelected]}
          onPress={() => setActive('documents')}
        >
          <View style={styles.navIconWrapDocs}>
            <Ionicons name="document-text-outline" size={28} color={colors.tint} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle">{t('plot_nav_documents_title')}</ThemedText>
            <ThemedText type="default">{documentsNavSubtitle}</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.iconMuted} />
        </Pressable>

        <Pressable
          style={[styles.navCard, active === 'deliveries' && styles.navCardSelected]}
          onPress={() => setActive('deliveries')}
        >
          <View style={styles.navIconWrapHarvest}>
            <Ionicons name="receipt-outline" size={28} color={colors.link} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle">{t('plot_nav_deliveries_title')}</ThemedText>
            <ThemedText type="default">
              {t('plot_nav_deliveries_sub', { n: plotDeliveryCount })}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.iconMuted} />
        </Pressable>

        {plot ? (
          <View style={styles.deletePlotSection}>
            <ThemedText type="caption" style={styles.deletePlotSectionNote}>
              {t('delete_plot_section_note')}
            </ThemedText>
            <UiButton variant="danger" fullWidth onPress={confirmDeletePlot} style={styles.deletePlotButton}>
              {t('delete_plot_action')}
            </UiButton>
          </View>
        ) : null}
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
              tenureVerifications={visibleTenureVerifications}
              isSyncedToServer={Boolean(backendPlotId)}
              onReplaceLandPaper={() => void replaceLandPaper()}
            />

            {nextDocumentStep ? (
              <Card variant="outlined" style={styles.docNextStepCard}>
                <ThemedText type="defaultSemiBold">{t('plot_documents_next_step_title')}</ThemedText>
                {!(nextDocumentStep.id === 'land' && visibleTenureVerifications.length > 0) ? (
                  <ThemedText type="caption" style={{ marginTop: 4 }}>
                    {nextDocumentStep.hint}
                  </ThemedText>
                ) : null}
              </Card>
            ) : (
              <Card variant="outlined" style={styles.docAllSetCard}>
                <ThemedText type="defaultSemiBold">
                  {landChecklistDone
                    ? t('plot_land_papers_all_set')
                    : t('plot_documents_next_step_title')}
                </ThemedText>
                {!landChecklistDone &&
                plotStatusRemainingRows[0] &&
                !(plotStatusRemainingRows[0].id === 'land' && visibleTenureVerifications.length > 0) ? (
                  <ThemedText type="caption" style={{ marginTop: 4 }}>
                    {plotStatusRemainingRows[0].hint}
                  </ThemedText>
                ) : null}
              </Card>
            )}

            {landChecklistDone && !landPapersExpanded ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: false }}
                onPress={() => setLandPapersExpanded(true)}
              >
                <Card variant="outlined" style={styles.docLandEditToggle}>
                  <View style={styles.docLandEditToggleRow}>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="defaultSemiBold">{t('plot_land_papers_show_edit')}</ThemedText>
                      <ThemedText type="caption" style={styles.docLandEditToggleSub}>
                        {t('plot_land_papers_show_edit_sub', { n: titlePhotos.length })}
                      </ThemedText>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={colors.link} />
                  </View>
                </Card>
              </Pressable>
            ) : (
              <>
                {landChecklistDone ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: true }}
                    onPress={() => setLandPapersExpanded(false)}
                    style={styles.docLandCollapseHeader}
                  >
                    <ThemedText type="caption" style={styles.docLandCollapseLabel}>
                      {t('plot_land_papers_hide_edit')}
                    </ThemedText>
                    <Ionicons name="chevron-up" size={18} color={colors.textMuted} />
                  </Pressable>
                ) : null}
                <PlotLandPapersCard
                  titlePhotos={titlePhotos}
                  tenureEvidence={tenureEvidenceItems}
                  cadastralKey={cadastralKey}
                  onCadastralKeyChange={setCadastralKey}
                  uploadingProof={uploadingLandProof}
                  onUploadProof={() => void uploadLandProof()}
                  onPreview={(item) => setDocPreviewItem(item)}
                  onDeleteTitlePhoto={(photo) =>
                    confirmDeleteLandDocument(() => void removeLandTitlePhoto(photo))
                  }
                  onDeleteTenureEvidence={(item) =>
                    confirmDeleteLandDocument(() => void removeTenureEvidence(item))
                  }
                  notSyncedHint={
                    !backendPlotId && farmer?.id && titlePhotos.length > 0
                      ? t('plot_documents_plot_not_synced_hint')
                      : null
                  }
                  syncMessage={docSyncMessage}
                  syncTone={docSyncTone}
                />
              </>
            )}

            <PlotEvidencePanel
              scopeId={plot.id}
              farmerId={farmer?.id}
              evidence={evidence}
              onEvidenceChange={setEvidence}
              overlapFlags={overlapFlags}
              serverPlotId={backendPlotId}
              overlapOnly
              showFpicStructured={overlapFlags.indigenous}
              producerFpicCount={producerFpicCount}
              producerAttestationsComplete={producerAttestationsComplete}
              onSyncComplete={refreshTenureVerification}
            />
          </>
        ) : null}

        {active === 'deliveries' && !plot ? (
          <Card variant="outlined" style={styles.harvestRowCard}>
            <ThemedText type="defaultSemiBold">{t('plot_not_found')}</ThemedText>
            <ThemedText type="caption" style={{ marginTop: 6, color: colors.textMuted }}>
              {t('harvest_plot_not_on_device')}
            </ThemedText>
          </Card>
        ) : null}

        {active === 'deliveries' && plot ? (
          <>
            <View style={{ marginBottom: 12 }}>
              <UiButton variant="primary" fullWidth onPress={openRecordDeliveryForPlot}>
                {t('plot_harvest_record_delivery')}
              </UiButton>
            </View>

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

            <DeliveryReceiptsBrowser
              t={t}
              vouchers={vouchers}
              mergedPlots={harvestPlotOptions}
              plotIdFilter={harvestPlotId ?? plot?.id ?? null}
              plotIdAliases={plotReceiptFilterIds}
              plotNameFilter={String(plot.name ?? t('plot_fallback'))}
              pendingReceipts={pendingHarvestReceipts}
              deviceReceipts={deviceHarvestReceipts}
              plotServerLinks={plotServerLinks}
            />
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

      <DocumentPreviewModal
        visible={docPreviewItem != null}
        item={docPreviewItem}
        onClose={() => setDocPreviewItem(null)}
        onDelete={
          docPreviewItem?.deleteTarget
            ? () => {
                const target = docPreviewItem.deleteTarget!;
                confirmDeleteLandDocument(() => {
                  if (target.kind === 'land_title_photo') {
                    const photo = titlePhotos.find((row) => row.id === target.id);
                    if (photo) void removeLandTitlePhoto(photo);
                    return;
                  }
                  const row = tenureEvidenceItems.find((item) => item.id === target.id);
                  if (row) void removeTenureEvidence(row);
                });
              }
            : undefined
        }
      />
    </ThemedView>
  );
}


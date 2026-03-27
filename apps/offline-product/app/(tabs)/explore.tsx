import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { Region } from 'react-native-maps';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Badge, ComplianceBadge } from '@/components/ui/badge';
import { ActionButton as Button } from '@/components/ui/action-button';
import { Input } from '@/components/ui/input';
import { useAppState, Plot } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  loadPhotosForPlot,
  loadPlotCadastralKey,
  loadPlotTenure,
  loadTitlePhotosForPlot,
  loadEvidenceForPlot,
  loadPendingSyncActions,
  enqueuePendingSync,
  deletePendingSyncAction,
  markPendingSyncAttempt,
  persistPlotPhoto,
  persistPlotTitlePhoto,
  persistPlotEvidenceItem,
  savePlotCadastralKey,
  savePlotTenure,
  getSetting,
  setSetting,
  logAuditEvent,
  loadLocalAuditEvents,
  type LocalAuditEvent,
  type PlotPhoto,
  type PlotTitlePhoto,
  type PlotEvidenceItem,
  type PlotEvidenceKind,
} from '@/features/state/persistence';
import {
  downloadOfflineTilePack,
  estimateTilesForBbox,
  type OfflineTilesProgress,
} from '@/features/offlineTiles/offlineTiles';
import * as ImagePicker from 'expo-image-picker';
import {
  buildGeometryFromLocalPlot,
  createDdsPackageForFarmer,
  fetchDdsPackagesForFarmer,
  fetchPlotsForFarmer,
  fetchVouchersForFarmer,
  fetchAuditForFarmer,
  fetchVoucherByQrRef,
  postHarvestToBackend,
  postPlotToBackend,
  runComplianceCheckForPlot,
  runGfwCheckForPlot,
  submitDdsPackage,
  syncPlotPhotosToBackend,
  updatePlotMetadataOnBackend,
  fetchDdsPackageTracesJson,
  syncPlotLegalToBackend,
  syncPlotEvidenceToBackend,
} from '@/features/api/postPlot';
import {
  listUnsyncedLocalPlots,
  subscribeServerPlotSyncChanged,
  uploadUnsyncedPlotsForFarmer,
} from '@/features/sync/plotServerSync';
import * as DocumentPicker from 'expo-document-picker';
import { CompactTabHeader } from '@/components/layout/CompactTabHeader';
import { PlotMap } from '@/components/plot-map/PlotMap';
import { compactTabHeaderStyles } from '@/constants/compactTabHeader';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function computeRegionFromPlot(plot: Plot): Region | undefined {
  if (plot.points.length === 0) {
    return undefined;
  }

  const avgLat =
    plot.points.reduce((sum, p) => sum + p.latitude, 0) / plot.points.length;
  const avgLon =
    plot.points.reduce((sum, p) => sum + p.longitude, 0) / plot.points.length;

  return {
    latitude: avgLat,
    longitude: avgLon,
    latitudeDelta: 0.002,
    longitudeDelta: 0.002,
  };
}

type PlotListTranslate = (key: string, values?: Record<string, string | number>) => string;

/** Matches plot detail: show GPS + declared lines when both exist; declared alone if no GPS area. */
function renderPlotListAreaCaption(plot: Plot, t: PlotListTranslate) {
  const hasGpsArea = plot.areaHectares > 0;
  const dec = plot.declaredAreaHectares;
  const hasDeclared = dec != null && Number.isFinite(dec);
  if (hasGpsArea && hasDeclared) {
    return (
      <View style={{ gap: 2 }}>
        <ThemedText type="caption">{t('plot_hectares_gps', { n: plot.areaHectares.toFixed(1) })}</ThemedText>
        <ThemedText type="caption">{t('plot_hectares_declared', { n: dec.toFixed(2) })}</ThemedText>
      </View>
    );
  }
  if (hasDeclared && !hasGpsArea) {
    return <ThemedText type="caption">{t('plot_hectares_declared', { n: dec.toFixed(2) })}</ThemedText>;
  }
  return (
    <ThemedText type="caption">
      {plot.areaHectares.toFixed(1)} {t('ha_suffix')}
    </ThemedText>
  );
}

export default function PlotsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ plotId?: string; focus?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [sectionY, setSectionY] = useState<{ photos?: number; documents?: number }>({});
  const { plots, farmer, renamePlot, removePlot } = useAppState();
  const [backendPlots, setBackendPlots] = useState<any[]>([]);
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [complianceBusyId, setComplianceBusyId] = useState<string | null>(null);
  const [gfwBusyId, setGfwBusyId] = useState<string | null>(null);
  const [kgInput, setKgInput] = useState('');
  const [harvestMessage, setHarvestMessage] = useState<string | null>(null);
  const [overlapOverrideReason, setOverlapOverrideReason] = useState('');
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [ddsPackages, setDdsPackages] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [localAuditEvents, setLocalAuditEvents] = useState<LocalAuditEvent[]>([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | undefined>(undefined);
  const [selectedPlotId, setSelectedPlotId] = useState<string | undefined>(
    plots[0]?.id,
  );
  const [submittingPackage, setSubmittingPackage] = useState(false);
  const { t, lang, setLang } = useLanguage();
  const [photos, setPhotos] = useState<PlotPhoto[]>([]);
  const [titlePhotos, setTitlePhotos] = useState<PlotTitlePhoto[]>([]);
  const [evidence, setEvidence] = useState<PlotEvidenceItem[]>([]);
  const [evidenceReason, setEvidenceReason] = useState('');
  const [fpicSignerName, setFpicSignerName] = useState('');
  const [cadastralKey, setCadastralKey] = useState('');
  const [informalTenure, setInformalTenure] = useState(false);
  const [informalTenureNote, setInformalTenureNote] = useState('');
  const [legalEditReason, setLegalEditReason] = useState('');
  const [legalSyncReason, setLegalSyncReason] = useState('');
  const [lastSavedLegalReason, setLastSavedLegalReason] = useState<string | null>(null);
  const [originalCadastralKey, setOriginalCadastralKey] = useState('');
  const [originalInformalTenure, setOriginalInformalTenure] = useState(false);
  const [originalInformalTenureNote, setOriginalInformalTenureNote] = useState('');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editReason, setEditReason] = useState('');
  const [lowDataMap, setLowDataMap] = useState(false);
  const [offlineTilesEnabled, setOfflineTilesEnabled] = useState(false);
  const [offlineTilesPackId, setOfflineTilesPackId] = useState<string | null>(null);
  const [tilesPackBusy, setTilesPackBusy] = useState(false);
  const tilesPackCancelRef = useRef(false);
  const [tilesPackProgress, setTilesPackProgress] = useState<OfflineTilesProgress | null>(null);
  const [tilesPackMessage, setTilesPackMessage] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingBusy, setPendingBusy] = useState(false);
  const [photoCountByPlotId, setPhotoCountByPlotId] = useState<Record<string, number>>({});
  const [plotChecklistDoneByPlotId, setPlotChecklistDoneByPlotId] = useState<Record<string, boolean>>({});
  const [uploadPlotBusy, setUploadPlotBusy] = useState(false);
  const isAuthMissing =
    !!backendError &&
    (backendError.toLowerCase().includes('not logged in') ||
      backendError.toLowerCase().includes('no access token'));

  const unsyncedPlotCount = useMemo(
    () => (farmer ? listUnsyncedLocalPlots(plots, backendPlots).length : 0),
    [farmer, plots, backendPlots],
  );
  const totalPendingSync = pendingCount + unsyncedPlotCount;

  // Deep-link support from Home dashboard (e.g. Complete Now).
  useEffect(() => {
    const pid = typeof params.plotId === 'string' ? params.plotId : undefined;
    if (pid) {
      setSelectedPlotId(pid);
    }
  }, [params.plotId]);

  useEffect(() => {
    const focus = typeof params.focus === 'string' ? params.focus : undefined;
    if (!focus) return;
    const y =
      focus === 'photos' ? sectionY.photos :
      focus === 'documents' ? sectionY.documents :
      undefined;
    if (y == null) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    }, 60);
    return () => clearTimeout(t);
  }, [params.focus, sectionY.photos, sectionY.documents]);

  const selectedPlot = useMemo(
    () => plots.find((p) => p.id === selectedPlotId),
    [plots, selectedPlotId],
  );

  const selectedBackendPlot = useMemo(() => {
    if (!selectedPlot) return undefined;
    return backendPlots.find(
      (p) => String(p?.name ?? '') === String(selectedPlot.name ?? ''),
    );
  }, [backendPlots, selectedPlot]);

  /** Backend UUID for API calls (local `plot.id` is not the server id). */
  const serverPlotId = selectedBackendPlot?.id ? String(selectedBackendPlot.id) : null;

  const selectedBackendRejected = useMemo(() => {
    const p = selectedBackendPlot;
    if (!p) return false;
    return p.sinaph_overlap || p.indigenous_overlap;
  }, [selectedBackendPlot]);

  const refreshFromBackend = () => {
    if (!farmer) return Promise.resolve();
    setLoadingBackend(true);
    setBackendError(null);
    return Promise.all([
      fetchPlotsForFarmer(farmer.id),
      fetchVouchersForFarmer(farmer.id),
      fetchDdsPackagesForFarmer(farmer.id),
      // Audit history is best-effort: avoid failing the whole sync if backend tables/migrations
      // are temporarily missing (e.g. during early development).
      fetchAuditForFarmer(farmer.id).catch(() => []),
    ])
      .then(([rows, voucherRows, pkgRows, auditRows]) => {
        setBackendPlots(rows ?? []);
        setVouchers(voucherRows ?? []);
        setDdsPackages(pkgRows ?? []);
        setAuditEvents(auditRows ?? []);
        setLastSyncAt(Date.now());
      })
      .catch((err) => {
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not reach backend. Working offline from local data.';
        if (typeof msg === 'string' && msg.toLowerCase().includes('no access token')) {
          setBackendError(
            'Not logged in to backend. Go to Settings → Backend account and enter your Supabase email/password.',
          );
        } else {
        setBackendError(
          msg,
        );
        }
        setBackendPlots([]);
        setVouchers([]);
        setDdsPackages([]);
        setAuditEvents([]);
      })
      .finally(() => setLoadingBackend(false));
  };

  const refreshPendingCount = () => {
    loadPendingSyncActions().then((actions) => setPendingCount(actions.length));
  };

  const processPendingUploads = async () => {
    setPendingBusy(true);
    const resolveBackendPlotId = async (localPlotId: string): Promise<string | null> => {
      const local = plots.find((p) => p.id === localPlotId);
      if (!local || !farmer) return null;
      try {
        const rows = await fetchPlotsForFarmer(farmer.id);
        const hit = (rows ?? []).find(
          (p: { name?: string }) => String(p?.name ?? '') === String(local.name ?? ''),
        );
        return hit?.id ? String(hit.id) : null;
      } catch {
        return null;
      }
    };

    try {
      const actions = await loadPendingSyncActions();
      for (const a of actions) {
        let payload: any = null;
        try {
          payload = JSON.parse(a.payloadJson);
        } catch {
          // Bad payload, drop it.
          deletePendingSyncAction(a.id);
          continue;
        }

        try {
          if (a.actionType === 'harvest') {
            const localId = String(payload?.plotId ?? '');
            const sid = await resolveBackendPlotId(localId);
            if (!sid) {
              markPendingSyncAttempt(a.id, {
                attempts: (a.attempts ?? 0) + 1,
                lastError: 'Plot not on server yet — upload plot from My Plots first.',
              });
              continue;
            }
            await postHarvestToBackend({ ...payload, plotId: sid });
          } else if (a.actionType === 'photos_sync') {
            const localId = String(payload?.plotId ?? '');
            const sid = await resolveBackendPlotId(localId);
            if (!sid) {
              markPendingSyncAttempt(a.id, {
                attempts: (a.attempts ?? 0) + 1,
                lastError: 'Plot not on server — upload from My Plots first.',
              });
              continue;
            }
            await syncPlotPhotosToBackend({ ...payload, plotId: sid });
          } else if (a.actionType === 'evidence_sync') {
            const plotIdRaw = payload?.plotId as string | undefined;
            const reason = String(payload?.reason ?? '').trim();
            const sid = plotIdRaw ? await resolveBackendPlotId(plotIdRaw) : null;
            if (!plotIdRaw || !sid || reason.length === 0) {
              if (plotIdRaw && reason.length > 0 && !sid) {
                markPendingSyncAttempt(a.id, {
                  attempts: (a.attempts ?? 0) + 1,
                  lastError: 'Plot not on server — upload from My Plots first.',
                });
              } else {
                deletePendingSyncAction(a.id);
              }
              continue;
            }
            const items = await loadEvidenceForPlot(plotIdRaw);
            const kinds: PlotEvidenceKind[] = [
              'fpic_repository',
              'protected_area_permit',
              'labor_evidence',
              'tenure_evidence',
            ];
            for (const k of kinds) {
              const subset = items
                .filter((ev) => ev.kind === k)
                .map((ev) => ({
                  kind: ev.kind,
                  uri: ev.uri,
                  label: ev.label ?? null,
                  mimeType: ev.mimeType ?? null,
                  takenAt: ev.takenAt,
                }));
              if (subset.length === 0) continue;
              await syncPlotEvidenceToBackend({
                plotId: sid,
                kind: k,
                items: subset,
                reason,
                note: 'Evidence repository sync from pending queue',
              });
            }
          }
          deletePendingSyncAction(a.id);
        } catch (e) {
          markPendingSyncAttempt(a.id, {
            attempts: (a.attempts ?? 0) + 1,
            lastError: e instanceof Error ? e.message : String(e),
          });
        }
      }
    } finally {
      refreshPendingCount();
      setPendingBusy(false);
    }
  };

  const refreshFromBackendRef = useRef(refreshFromBackend);
  refreshFromBackendRef.current = refreshFromBackend;

  useEffect(() => {
    if (!farmer?.id) return;
    return subscribeServerPlotSyncChanged(() => {
      void refreshFromBackendRef.current();
      refreshPendingCount();
    });
  }, [farmer?.id]);

  useEffect(() => {
    if (!farmer) {
      setBackendPlots([]);
      setVouchers([]);
      setDdsPackages([]);
      setAuditEvents([]);
      setLocalAuditEvents([]);
      setBackendError(null);
      setLastSyncAt(null);
      setPendingCount(0);
      return;
    }
    refreshFromBackend();
    refreshPendingCount();
    loadLocalAuditEvents({ limit: 50 }).then(setLocalAuditEvents).catch(() => undefined);
  }, [farmer?.id]);

  /** After signing in under Settings, refetch plots when returning to this tab. */
  useFocusEffect(
    useCallback(() => {
      if (farmer?.id) {
        void refreshFromBackend();
        refreshPendingCount();
      }
    }, [farmer?.id]),
  );

  useEffect(() => {
    getSetting('offlineTilesEnabled')
      .then((v) => setOfflineTilesEnabled(v === '1'))
      .catch(() => undefined);
    getSetting('offlineTilesActivePackId')
      .then((v) => setOfflineTilesPackId(v && v.length > 0 ? v : null))
      .catch(() => undefined);
  }, []);

  const region = selectedPlot ? computeRegionFromPlot(selectedPlot) : undefined;

  useEffect(() => {
    if (!selectedPlotId) {
      setPhotos([]);
      setTitlePhotos([]);
      setEvidence([]);
      setEvidenceReason('');
      setCadastralKey('');
      setInformalTenure(false);
      setInformalTenureNote('');
      setLegalEditReason('');
      setLegalSyncReason('');
      setLastSavedLegalReason(null);
      setOriginalCadastralKey('');
      setOriginalInformalTenure(false);
      setOriginalInformalTenureNote('');
      return;
    }
    loadPhotosForPlot(selectedPlotId).then(setPhotos);
    loadTitlePhotosForPlot(selectedPlotId).then(setTitlePhotos);
    loadEvidenceForPlot(selectedPlotId).then(setEvidence);
    loadPlotCadastralKey(selectedPlotId).then((key) => {
      const v = key ?? '';
      setCadastralKey(v);
      setOriginalCadastralKey(v);
    });
    loadPlotTenure(selectedPlotId).then((t) => {
      setInformalTenure(t.informalTenure);
      const note = t.informalTenureNote ?? '';
      setInformalTenureNote(note);
      setOriginalInformalTenure(t.informalTenure);
      setOriginalInformalTenureNote(note);
    });
  }, [selectedPlotId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const photoEntries = await Promise.all(
        plots.map(async (p) => {
          const rows = await loadPhotosForPlot(p.id).catch(() => []);
          return [p.id, rows.length] as const;
        }),
      );
      const checklistEntries = await Promise.all(
        plots.map(async (p) => {
          const backendMatch = backendPlots.find(
            (bp) => String(bp?.name ?? '') === String(p.name ?? ''),
          ) as
            | { sinaph_overlap?: boolean; indigenous_overlap?: boolean; status?: string }
            | undefined;
          const [titleRows, evidenceRows] = await Promise.all([
            loadTitlePhotosForPlot(p.id).catch(() => []),
            loadEvidenceForPlot(p.id).catch(() => []),
          ]);
          const groundOk = (photoEntries.find(([id]) => id === p.id)?.[1] ?? 0) >= 4;
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
      setPhotoCountByPlotId(Object.fromEntries(photoEntries));
      setPlotChecklistDoneByPlotId(Object.fromEntries(checklistEntries));
    })();
    return () => {
      cancelled = true;
    };
  }, [plots, backendPlots]);

  useEffect(() => {
    if (selectedPlot) {
      setEditName(selectedPlot.name);
    } else {
      setEditName('');
    }
    setEditReason('');
  }, [selectedPlot?.id]);

  useEffect(() => {
    if (!scannerActive) return;
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
  }, [scannerActive, cameraPermission?.granted, requestCameraPermission]);

  const statusForPlot = (plot: Plot): 'Compliant' | 'Action Needed' => {
    const p = backendPlots.find((bp) => String(bp?.name ?? '') === String(plot.name ?? ''));
    const checklistDone = plotChecklistDoneByPlotId[plot.id] === true;
    if (checklistDone) return 'Compliant';
    if (!p) return 'Action Needed';
    return p.status === 'compliant' ? 'Compliant' : 'Action Needed';
  };
  const harvestCountForPlot = (plotName: string) => {
    const backend = backendPlots.find((bp) => String(bp?.name ?? '') === plotName);
    if (!backend?.id) return 0;
    return vouchers.filter((v) => String(v?.plot_id ?? '') === String(backend.id)).length;
  };
  const confirmDeletePlot = (plot: Plot) => {
    Alert.alert(
      t('warning'),
      t('delete_plot_body'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            const fallback = plots.find((p) => p.id !== plot.id)?.id;
            removePlot(plot.id);
            if (selectedPlotId === plot.id) {
              setSelectedPlotId(fallback);
            }
          },
        },
      ],
    );
  };

  if (true) {
    return (
      <ThemedView style={styles.screen}>
        <CompactTabHeader
          paddingTop={insets.top}
          badge={
            <Badge variant={totalPendingSync > 0 ? 'warning' : 'success'} size="sm">
              {totalPendingSync > 0 ? t('pending_count', { n: totalPendingSync }) : t('online')}
            </Badge>
          }
          left={
            <Pressable onPress={() => router.push('/')} style={compactTabHeaderStyles.backButton}>
              <Ionicons name="chevron-back" size={20} color={colors.textInverse} />
              <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
                {t('back')}
              </ThemedText>
            </Pressable>
          }
          centerTitle={t('my_plots_header')}
          onLanguagePress={() => setLang(lang === 'en' ? 'es' : 'en')}
          languageLabel={String(lang)}
          textInverseColor={colors.textInverse}
        />

        <ThemedScrollView contentContainerStyle={styles.containerCompact}>
          {plots.map((plot) => {
            const status = statusForPlot(plot);
            const statusLabel = status === 'Compliant' ? t('status_compliant') : t('status_action_needed');
            const badgeVariant = status === 'Compliant' ? 'success' : 'warning';
            const photosCount = photoCountByPlotId[plot.id] ?? 0;
            const harvestCount = harvestCountForPlot(plot.name);
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
                  <View style={styles.rowHeader}>
                    <ThemedText type="subtitle">{plot.name}</ThemedText>
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
                      <Ionicons name="camera-outline" size={16} color="#8A8A8A" />
                      <ThemedText type="caption">{t('photos_meta', { n: photosCount })}</ThemedText>
                    </View>
                    <View style={styles.plotMetaItem}>
                      <Ionicons name="scale-outline" size={16} color="#8A8A8A" />
                      <ThemedText type="caption">{t('harvests_meta', { n: harvestCount })}</ThemedText>
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

  return (
    <ThemedView style={styles.screen}>
      <LinearGradient
        colors={['#0A7F59', '#0B6F50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.profilePill}>
            <Ionicons name="map-outline" size={20} color={colors.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
              {t('my_plots')}
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textInverse, opacity: 0.9 }}>
              {farmer ? (farmer.name || 'Farmer profile') : t('no_farmer')}
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

      <ThemedScrollView ref={scrollRef} contentContainerStyle={styles.container}>

      <Card style={styles.card} variant="elevated">
        <View style={styles.rowHeader}>
          <ThemedText type="defaultSemiBold">Sync status</ThemedText>
          {loadingBackend ? (
            <Badge variant="warning" size="sm">
              Checking
            </Badge>
          ) : backendError ? (
            <Badge variant="default" size="sm">
              Offline
            </Badge>
          ) : (
            <Badge variant="success" size="sm">
              Online
            </Badge>
          )}
        </View>

        {loadingBackend ? (
          <ThemedText type="caption">Checking backend…</ThemedText>
        ) : backendError ? (
          <ThemedText type="caption">
            {isAuthMissing
              ? 'Backend account not connected. Local mode is active.'
              : 'Offline — working from local data only.'}
          </ThemedText>
        ) : (
          <ThemedText type="caption">Online — data synced with backend.</ThemedText>
        )}

        {lastSyncAt ? (
          <ThemedText type="caption">Last sync: {new Date(lastSyncAt).toLocaleString()}</ThemedText>
        ) : null}

        <ThemedText type="caption">
          Pending uploads: {totalPendingSync}
          {unsyncedPlotCount > 0 && pendingCount > 0
            ? ` (${unsyncedPlotCount} plot(s) not on server, ${pendingCount} queued)`
            : unsyncedPlotCount > 0
              ? ` (${unsyncedPlotCount} plot(s) not on server)`
              : pendingCount > 0
                ? ` (${pendingCount} queued)`
                : ''}
        </ThemedText>

        {farmer ? (
          <View style={{ marginTop: 10, gap: 10 }}>
            <Button
              title={loadingBackend ? 'Syncing…' : 'Retry sync now'}
              disabled={loadingBackend}
              variant="secondary"
              onPress={async () => {
                if (farmer?.id && plots.length > 0) {
                  await uploadUnsyncedPlotsForFarmer({ farmerId: farmer.id, localPlots: plots });
                }
                await refreshFromBackend();
                refreshPendingCount();
              }}
            />
            {isAuthMissing ? (
              <Button
                title="Connect backend account"
                variant="secondary"
                onPress={() => router.push('/settings')}
              />
            ) : null}
            {pendingCount > 0 ? (
              <Button
                title={pendingBusy ? 'Retrying uploads…' : 'Retry pending uploads'}
                disabled={pendingBusy}
                variant="secondary"
                onPress={processPendingUploads}
              />
            ) : null}
          </View>
        ) : null}
      </Card>

      <Collapsible title="How this works">
        <View style={{ gap: 8 }}>
          <ThemedText type="caption">
            1) On the Record tab, walk the plot perimeter with GPS and save the plot with a farmer declaration.
          </ThemedText>
          <ThemedText type="caption">
            2) Plots are stored offline and synced to the backend whenever the network is available.
          </ThemedText>
          <ThemedText type="caption">
            3) In “Synced plots (backend)” you can run compliance checks, record harvests (vouchers), and create DDS packages.
          </ThemedText>
        </View>
      </Collapsible>

      {backendError && !isAuthMissing && (
        <Card
          style={[
            styles.errorBanner,
            { backgroundColor: colors.backgroundSecondary, borderColor: '#D4B48B' },
          ]}
          variant="outlined"
        >
          <ThemedText type="defaultSemiBold">Offline mode active</ThemedText>
          <ThemedText type="caption">
            Backend sync is temporarily unavailable. Your local plots remain available.
          </ThemedText>
        </Card>
      )}

      <>
        <SectionHeader title="Local plots" subtitle={`${plots.length} saved on device`} />
        {plots.length === 0 ? (
          <Card variant="elevated">
            <View style={styles.emptyState}>
              <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
                No plots yet
              </ThemedText>
              <ThemedText type="caption" style={{ textAlign: 'center' }}>
                Go to the Home tab and walk a perimeter (or save a point) to register your first plot.
              </ThemedText>
            </View>
          </Card>
        ) : (
          <View style={styles.plotList}>
            {plots.map((plot) => (
              <Pressable
                key={plot.id}
                onPress={() => {
                  setSelectedPlotId(plot.id);
                  router.push(`/plot/${encodeURIComponent(plot.id)}`);
                }}
              >
                <Card
                  variant={selectedPlotId === plot.id ? 'elevated' : 'outlined'}
                  style={[
                    styles.plotCard,
                    selectedPlotId === plot.id && styles.plotCardSelected,
                  ]}
                >
                  <View style={styles.plotCardHeader}>
                    <View style={styles.plotInfo}>
                      <ThemedText type="defaultSemiBold">{plot.name}</ThemedText>
                      <ThemedText type="caption">
                        {plot.areaSquareMeters.toFixed(1)} m² ({plot.areaHectares.toFixed(4)} ha)
                      </ThemedText>
                    </View>
                    <Badge variant={plot.kind === 'polygon' ? 'info' : 'default'} size="sm">
                      {plot.kind}
                    </Badge>
                  </View>
                  {plot.declaredAreaHectares != null && Number.isFinite(plot.declaredAreaHectares) ? (
                    <ThemedText type="caption" style={styles.discrepancyText}>
                      {t('plot_hectares_declared', { n: plot.declaredAreaHectares.toFixed(2) })}
                      {plot.discrepancyPercent != null
                        ? ` (${plot.discrepancyPercent.toFixed(1)}% diff)`
                        : ''}
                    </ThemedText>
                  ) : null}
                </Card>
              </Pressable>
            ))}
          </View>
        )}

        {selectedPlot && region && (
            <>
              <Card style={styles.card} variant="outlined">
                <ThemedText type="defaultSemiBold">Tracebud server</ThemedText>
                {backendError ? (
                  <ThemedText type="caption" style={{ marginTop: 6 }}>
                    Fix sync or sign in using the Sync status card above, then upload this plot.
                  </ThemedText>
                ) : selectedBackendPlot ? (
                  <ThemedText type="caption" style={{ marginTop: 6 }}>
                    This plot is on the server — photo / legality sync and harvests use the Tracebud copy.
                  </ThemedText>
                ) : (
                  <>
                    <ThemedText type="caption" style={{ marginTop: 6 }}>
                      This plot exists only on the device until you upload it (for example if you saved it before
                      signing in under Settings).
                    </ThemedText>
                    <Button
                      title={uploadPlotBusy ? 'Uploading…' : 'Upload plot to Tracebud'}
                      disabled={uploadPlotBusy || !farmer}
                      variant="secondary"
                      style={{ marginTop: 10 }}
                      onPress={async () => {
                        if (!farmer || !selectedPlot) return;
                        setUploadPlotBusy(true);
                        setSyncMessage(null);
                        try {
                          const geometry = buildGeometryFromLocalPlot(selectedPlot);
                          const r = await postPlotToBackend({
                            farmerId: farmer.id,
                            clientPlotId: selectedPlot.name,
                            geometry,
                            declaredAreaHa: selectedPlot.declaredAreaHectares ?? selectedPlot.areaHectares ?? null,
                            precisionMeters: selectedPlot.precisionMetersAtSave ?? null,
                            cadastralKey: cadastralKey.trim() ? cadastralKey.trim() : null,
                          });
                          if (!r.ok) {
                            setSyncMessage(
                              r.reason === 'no_access_token'
                                ? 'Sign in under Settings → Your profile with your Tracebud email and password.'
                                : r.message ?? 'Could not upload plot.',
                            );
                            return;
                          }
                          await refreshFromBackend();
                          setSyncMessage('Plot uploaded. You can sync photos and record harvests.');
                        } catch (e) {
                          setSyncMessage(e instanceof Error ? e.message : String(e));
                        } finally {
                          setUploadPlotBusy(false);
                        }
                      }}
                    />
                  </>
                )}
              </Card>

              <Card style={styles.card} variant="elevated">
                <View style={styles.mapHeaderRow}>
                  <ThemedText type="subtitle">Plot map</ThemedText>
                  <Button
                    title={lowDataMap ? 'Show map' : 'Low data'}
                    variant="ghost"
                    onPress={() => setLowDataMap((prev) => !prev)}
                  />
                </View>
                <View style={styles.mapContainer}>
                  <PlotMap
                    plot={selectedPlot}
                    region={region}
                    lowDataMap={lowDataMap}
                    offlineTilesEnabled={offlineTilesEnabled}
                    offlineTilesPackId={offlineTilesPackId}
                  />
                </View>
              </Card>
              {selectedBackendRejected ? (
                <Card style={styles.card} variant="outlined">
                  <View style={styles.rowHeader}>
                    <ThemedText type="defaultSemiBold">Amber flag: overlap requires review</ThemedText>
                    <Badge variant="warning" size="sm">
                      Amber
                    </Badge>
                  </View>
                  <ThemedText type="caption">
                    This plot overlaps{' '}
                    {selectedBackendPlot?.sinaph_overlap ? 'a SINAPH protected area' : ''}
                    {selectedBackendPlot?.sinaph_overlap &&
                    selectedBackendPlot?.indigenous_overlap
                      ? ' and '
                      : ''}
                    {selectedBackendPlot?.indigenous_overlap
                      ? 'an indigenous territory'
                      : ''}
                    . It is not auto-rejected — a compliance officer must attach permits/management plans if applicable.
                  </ThemedText>
                </Card>
              ) : null}
              <View style={styles.backendSection}>
                <ThemedText type="subtitle">Offline map pack</ThemedText>
                <ThemedText type="caption">
                  Download tiles around this plot for offline use (keep screen open while downloading).
                </ThemedText>
                {tilesPackMessage ? <ThemedText type="caption">{tilesPackMessage}</ThemedText> : null}
                {tilesPackProgress ? (
                  <ThemedText type="caption">
                    Progress: {tilesPackProgress.done}/{tilesPackProgress.total} (downloaded{' '}
                    {tilesPackProgress.downloaded}, skipped {tilesPackProgress.skipped})
                  </ThemedText>
                ) : null}
                <View style={{ marginTop: 8, gap: 8 }}>
                  <Button
                    title={tilesPackBusy ? 'Downloading…' : 'Download pack for this plot'}
                    disabled={tilesPackBusy || !selectedPlot}
                    variant="secondary"
                    onPress={async () => {
                      if (!selectedPlot) return;
                      setTilesPackBusy(true);
                      tilesPackCancelRef.current = false;
                      setTilesPackProgress(null);
                      setTilesPackMessage(null);
                      try {
                        const lats = selectedPlot.points.map((p) => p.latitude);
                        const lons = selectedPlot.points.map((p) => p.longitude);
                        const minLat = Math.min(...lats);
                        const maxLat = Math.max(...lats);
                        const minLon = Math.min(...lons);
                        const maxLon = Math.max(...lons);
                        const pad = 0.01; // ~1km-ish, good enough for pilots
                        const bbox = {
                          west: minLon - pad,
                          south: minLat - pad,
                          east: maxLon + pad,
                          north: maxLat + pad,
                        };
                        const zooms = [12, 13, 14, 15, 16];
                        const total = estimateTilesForBbox(bbox, zooms);
                        setTilesPackMessage(`Estimated tiles: ${total}. Starting download…`);

                        const packId = `plot-${selectedPlot.id}-${Date.now()}`;
                        const res = await downloadOfflineTilePack({
                          packId,
                          label: `Plot: ${selectedPlot.name}`,
                          bbox,
                          zooms,
                          onProgress: (p) => setTilesPackProgress(p),
                          shouldCancel: () => tilesPackCancelRef.current,
                        });

                        setOfflineTilesPackId(res.meta.id);
                        await setSetting('offlineTilesActivePackId', res.meta.id);
                        setTilesPackMessage(
                          `Done. Downloaded ${res.downloaded} tiles (skipped ${res.skipped}). Active pack set.`,
                        );
                      } catch (e) {
                        setTilesPackMessage(e instanceof Error ? e.message : 'Tile download failed.');
                      } finally {
                        setTilesPackBusy(false);
                      }
                    }}
                  />
                  {tilesPackBusy ? (
                    <Button
                      title="Cancel download"
                      variant="ghost"
                      onPress={() => {
                        tilesPackCancelRef.current = true;
                        setTilesPackMessage('Cancelling…');
                      }}
                    />
                  ) : null}
                </View>
              </View>
              <View style={styles.backendSection}>
                <ThemedText type="subtitle">Edit plot (local + audit)</ThemedText>
                <Input
                  label="New name"
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={selectedPlot.name}
                />
                <Input
                  label="Reason for edit (required)"
                  value={editReason}
                  onChangeText={setEditReason}
                  placeholder="e.g. corrected spelling, merged duplicate, etc."
                  containerStyle={{ marginTop: 10 }}
                />
                <Button
                  title="Save name & log edit"
                  onPress={async () => {
                    if (!selectedPlot || !editName.trim() || !editReason.trim()) {
                      return;
                    }
                    // Update local offline state
                    renamePlot(selectedPlot.id, editName.trim());

                    // Best-effort backend edit with immutable audit log
                    try {
                      const matchingBackend = backendPlots.find(
                        (p) => p.name === selectedPlot.name,
                      );
                      if (matchingBackend) {
                        await updatePlotMetadataOnBackend({
                          plotId: matchingBackend.id,
                          name: editName.trim(),
                          reason: editReason.trim(),
                          deviceId: undefined,
                        });
                        const rows = await fetchPlotsForFarmer(farmer!.id);
                        setBackendPlots(rows ?? []);
                      }
                      setSyncMessage('Plot name updated locally; edit logged when online.');
                    } catch (e) {
                      setSyncMessage(
                        e instanceof Error
                          ? e.message
                          : 'Plot renamed locally. Could not reach backend to log edit.',
                      );
                    }
                  }}
                />
              </View>
              <View style={styles.backendSection}>
                <ThemedText type="subtitle">Ground-truth photos</ThemedText>
                <View
                  onLayout={(e) => {
                    const y = e.nativeEvent?.layout?.y ?? 0;
                    setSectionY((prev) => ({ ...prev, photos: y }));
                  }}
                />
                <Button
                  title="Add ground-truth photo"
                  onPress={async () => {
                    if (!selectedPlot) return;

                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                      return;
                    }

                    const result = await ImagePicker.launchCameraAsync({
                      quality: 0.6,
                    });

                    if (result.canceled || !result.assets?.[0]?.uri) {
                      return;
                    }

                    const uri = result.assets[0].uri;
                    const firstPoint = selectedPlot.points[0];
                    const takenAt = Date.now();

                    persistPlotPhoto({
                      plotId: selectedPlot.id,
                      uri,
                      takenAt,
                      latitude: firstPoint?.latitude ?? null,
                      longitude: firstPoint?.longitude ?? null,
                    });

                    const updated = await loadPhotosForPlot(selectedPlot.id);
                    setPhotos(updated);
                  }}
                />
                {photos.length > 0 && (
                  <View style={styles.photoRow}>
                    {photos.slice(0, 4).map((p) => (
                      <Image
                        key={p.id}
                        source={{ uri: p.uri }}
                        style={styles.photoThumb}
                      />
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.backendSection}>
                <ThemedText type="subtitle">Legality / land title</ThemedText>
                <Input
                  label="Clave Catastral (local only)"
                  placeholder="e.g. 012-345-678-9"
                  value={cadastralKey}
                  onChangeText={setCadastralKey}
                />
                <View style={{ marginTop: 8 }}>
                  <Button
                    title="Scan Clave Catastral (OCR)"
                    onPress={async () => {
                      if (!selectedPlot) return;
                      setSyncMessage(null);
                      try {
                        const { status } = await ImagePicker.requestCameraPermissionsAsync();
                        if (status !== 'granted') {
                          setSyncMessage('Camera permission denied.');
                          return;
                        }
                        const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
                        if (result.canceled || !result.assets?.[0]?.uri) return;
                        const uri = result.assets[0].uri;

                        // OCR is optional: Expo Go may not include the native module.
                        let extracted: any = null;
                        try {
                          const mod: any = await import('expo-text-extractor');
                          const extractor = mod?.default ?? mod;
                          extracted = await extractor.extractText(uri);
                        } catch {
                          setSyncMessage(
                            'OCR module not available in this build. Use a Development Build, or type the key manually.',
                          );
                          return;
                        }
                        const text = Array.isArray(extracted) ? extracted.join(' ') : String(extracted ?? '');
                        const normalized = text.replace(/\s+/g, ' ').trim();

                        // Best-effort patterns seen in Honduras-style cadastral keys.
                        const candidates = [
                          normalized.match(/\b\d{3}-\d{3}-\d{3}-\d\b/)?.[0],
                          normalized.match(/\b\d{2,4}-\d{2,4}-\d{2,4}-\d\b/)?.[0],
                          normalized.match(/\b\d{9,12}\b/)?.[0],
                        ].filter(Boolean) as string[];

                        if (candidates.length === 0) {
                          setSyncMessage('OCR ran, but no cadastral key pattern was detected. Please type it manually.');
                          return;
                        }
                        setCadastralKey(candidates[0]);
                        setSyncMessage(`OCR detected: ${candidates[0]}`);
                      } catch (e) {
                        setSyncMessage(
                          e instanceof Error
                            ? `OCR failed: ${e.message}`
                            : 'OCR failed. Please type the key manually.',
                        );
                      }
                    }}
                  />
                </View>
                <View style={{ marginTop: 8 }}>
                  <Button
                    title={
                      informalTenure
                        ? '✔ Producer en Posesión (informal tenure)'
                        : 'Mark Producer en Posesión (informal tenure)'
                    }
                    onPress={() => {
                      const next = !informalTenure;
                      setInformalTenure(next);
                      if (!next) {
                        setInformalTenureNote('');
                      }
                    }}
                  />
                </View>
                {informalTenure ? (
                  <>
                    <Input
                      label="Informal tenure note (optional)"
                      placeholder="e.g. family possession, community recognized, pending paperwork…"
                      value={informalTenureNote}
                      onChangeText={setInformalTenureNote}
                      containerStyle={{ marginTop: 10 }}
                    />
                  </>
                ) : null}
                <Input
                  label="Reason for edit (required if you changed anything)"
                  placeholder="e.g. updated from land title photo, farmer clarified, corrected entry…"
                  value={legalEditReason}
                  onChangeText={setLegalEditReason}
                  containerStyle={{ marginTop: 10 }}
                />
                <View style={{ marginTop: 8 }}>
                  <Button
                    title="Save legality changes"
                    onPress={() => {
                      if (!selectedPlot || !farmer) return;

                      const nextCadastral = cadastralKey.trim();
                      const nextTenure = informalTenure;
                      const nextNote = informalTenure ? informalTenureNote.trim() : '';

                      const changed =
                        nextCadastral !== originalCadastralKey.trim() ||
                        nextTenure !== originalInformalTenure ||
                        nextNote !== (originalInformalTenure ? originalInformalTenureNote.trim() : '');

                      if (!changed) {
                        setSyncMessage('No legality changes to save.');
                        return;
                      }
                      if (legalEditReason.trim().length === 0) {
                        setSyncMessage('Reason is required to save legality changes.');
                        return;
                      }

                      savePlotCadastralKey(selectedPlot.id, nextCadastral || null);
                      savePlotTenure(selectedPlot.id, {
                        informalTenure: nextTenure,
                        informalTenureNote: nextTenure ? nextNote || null : null,
                      });

                      logAuditEvent({
                        userId: farmer.id,
                        eventType: 'plot_legal_edited',
                        payload: {
                          plotId: selectedPlot.id,
                          reason: legalEditReason.trim(),
                          previous: {
                            cadastralKey: originalCadastralKey || null,
                            informalTenure: originalInformalTenure,
                            informalTenureNote: originalInformalTenureNote || null,
                          },
                          next: {
                            cadastralKey: nextCadastral || null,
                            informalTenure: nextTenure,
                            informalTenureNote: nextTenure ? nextNote || null : null,
                          },
                        },
                      });

                      setOriginalCadastralKey(nextCadastral);
                      setOriginalInformalTenure(nextTenure);
                      setOriginalInformalTenureNote(nextNote);
                      setLastSavedLegalReason(legalEditReason.trim());
                      setLegalEditReason('');
                      setSyncMessage('Legality changes saved (local audit logged).');
                      loadLocalAuditEvents({ limit: 50 })
                        .then(setLocalAuditEvents)
                        .catch(() => undefined);
                    }}
                  />
                </View>

                <View style={{ marginTop: 12 }}>
                  <SectionHeader
                    title="Evidence repository"
                    subtitle="Attach FPIC, permits, labor, and tenure evidence (stored on-device; sync as metadata)."
                  />
                  <View
                    onLayout={(e) => {
                      const y = e.nativeEvent?.layout?.y ?? 0;
                      setSectionY((prev) => ({ ...prev, documents: y }));
                    }}
                  />

                  <Card variant="elevated" style={styles.card}>
                    <ThemedText type="defaultSemiBold">FPIC module (structured)</ThemedText>
                    <ThemedText type="caption">
                      Minutes, mapping, agreements + a signature record.
                    </ThemedText>
                    <View style={{ gap: 10, marginTop: 10 }}>
                      <Button
                        title="Add FPIC minutes (PDF/photo)"
                        variant="secondary"
                        onPress={async () => {
                          if (!selectedPlot) return;
                          const picked = await DocumentPicker.getDocumentAsync({
                            type: ['image/*', 'application/pdf', '*/*'],
                            copyToCacheDirectory: true,
                            multiple: false,
                          });
                          if (picked.canceled || !picked.assets?.[0]?.uri) return;
                          const asset = picked.assets[0];
                          persistPlotEvidenceItem({
                            plotId: selectedPlot.id,
                            kind: 'fpic_repository',
                            uri: asset.uri,
                            mimeType: asset.mimeType ?? null,
                            label: asset.name ?? 'fpic_minutes',
                            takenAt: Date.now(),
                          });
                          setEvidence(await loadEvidenceForPlot(selectedPlot.id));
                        }}
                      />
                      <Button
                        title="Add participatory mapping evidence"
                        variant="secondary"
                        onPress={async () => {
                          if (!selectedPlot) return;
                          const picked = await DocumentPicker.getDocumentAsync({
                            type: ['image/*', 'application/pdf', '*/*'],
                            copyToCacheDirectory: true,
                            multiple: false,
                          });
                          if (picked.canceled || !picked.assets?.[0]?.uri) return;
                          const asset = picked.assets[0];
                          persistPlotEvidenceItem({
                            plotId: selectedPlot.id,
                            kind: 'fpic_repository',
                            uri: asset.uri,
                            mimeType: asset.mimeType ?? null,
                            label: asset.name ?? 'fpic_participatory_mapping',
                            takenAt: Date.now(),
                          });
                          setEvidence(await loadEvidenceForPlot(selectedPlot.id));
                        }}
                      />
                      <Button
                        title="Add social agreement evidence"
                        variant="secondary"
                        onPress={async () => {
                          if (!selectedPlot) return;
                          const picked = await DocumentPicker.getDocumentAsync({
                            type: ['image/*', 'application/pdf', '*/*'],
                            copyToCacheDirectory: true,
                            multiple: false,
                          });
                          if (picked.canceled || !picked.assets?.[0]?.uri) return;
                          const asset = picked.assets[0];
                          persistPlotEvidenceItem({
                            plotId: selectedPlot.id,
                            kind: 'fpic_repository',
                            uri: asset.uri,
                            mimeType: asset.mimeType ?? null,
                            label: asset.name ?? 'fpic_social_agreement',
                            takenAt: Date.now(),
                          });
                          setEvidence(await loadEvidenceForPlot(selectedPlot.id));
                        }}
                      />
                    </View>
                    <Input
                      label="FPIC signature record (typed)"
                      placeholder="Signer name (community representative)"
                      value={fpicSignerName}
                      onChangeText={setFpicSignerName}
                      containerStyle={{ marginTop: 10 }}
                    />
                    <View style={{ marginTop: 10 }}>
                      <Button
                        title="Add signature record"
                        variant="primary"
                        onPress={async () => {
                          if (!selectedPlot) return;
                          const name = fpicSignerName.trim();
                          if (name.length === 0) return;
                          const takenAt = Date.now();
                          persistPlotEvidenceItem({
                            plotId: selectedPlot.id,
                            kind: 'fpic_repository',
                            uri: `text:fpic_signature:${encodeURIComponent(name)}:${takenAt}`,
                            mimeType: 'text/plain',
                            label: `FPIC signature: ${name}`,
                            takenAt,
                          });
                          setFpicSignerName('');
                          setEvidence(await loadEvidenceForPlot(selectedPlot.id));
                          logAuditEvent({
                            userId: farmer?.id,
                            eventType: 'plot_fpic_signed',
                            payload: { plotId: selectedPlot.id, signerName: name, takenAt },
                          }).catch(() => undefined);
                        }}
                      />
                    </View>
                  </Card>

                  <Card variant="elevated" style={styles.card}>
                    <ThemedText type="defaultSemiBold">Labor evidence</ThemedText>
                    <ThemedText type="caption">Attach photos/docs of working conditions.</ThemedText>
                    <View style={{ marginTop: 10 }}>
                      <Button
                        title="Attach labor evidence (photo/PDF)"
                        variant="secondary"
                        onPress={async () => {
                          if (!selectedPlot) return;
                          const picked = await DocumentPicker.getDocumentAsync({
                            type: ['image/*', 'application/pdf', '*/*'],
                            copyToCacheDirectory: true,
                            multiple: false,
                          });
                          if (picked.canceled || !picked.assets?.[0]?.uri) return;
                          const asset = picked.assets[0];
                          persistPlotEvidenceItem({
                            plotId: selectedPlot.id,
                            kind: 'labor_evidence',
                            uri: asset.uri,
                            mimeType: asset.mimeType ?? null,
                            label: asset.name ?? 'labor_evidence',
                            takenAt: Date.now(),
                          });
                          setEvidence(await loadEvidenceForPlot(selectedPlot.id));
                          logAuditEvent({
                            userId: farmer?.id,
                            eventType: 'plot_labor_evidence_added',
                            payload: {
                              plotId: selectedPlot.id,
                              uri: asset.uri,
                              mimeType: asset.mimeType ?? null,
                            },
                          }).catch(() => undefined);
                        }}
                      />
                    </View>
                  </Card>

                  <Input
                    label="Reason for evidence sync (required)"
                    placeholder="e.g. collected during community meeting, permit reviewed, field verification…"
                    value={evidenceReason}
                    onChangeText={setEvidenceReason}
                    containerStyle={{ marginTop: 10 }}
                  />

                  {(
                    [
                      ['fpic_repository', 'Add FPIC doc/photo'],
                      ['protected_area_permit', 'Add permit / management plan'],
                      ['labor_evidence', 'Add labor evidence'],
                      ['tenure_evidence', 'Add tenure evidence'],
                    ] as const
                  ).map(([kind, label]) => (
                    <View key={kind} style={{ marginTop: 8 }}>
                      <Button
                        title={label}
                        variant="secondary"
                        onPress={async () => {
                          if (!selectedPlot) return;
                          const picked = await DocumentPicker.getDocumentAsync({
                            type: ['image/*', 'application/pdf', '*/*'],
                            copyToCacheDirectory: true,
                            multiple: false,
                          });
                          if (picked.canceled || !picked.assets?.[0]?.uri) return;
                          const asset = picked.assets[0];
                          persistPlotEvidenceItem({
                            plotId: selectedPlot.id,
                            kind: kind as PlotEvidenceKind,
                            uri: asset.uri,
                            mimeType: asset.mimeType ?? null,
                            label: asset.name ?? null,
                            takenAt: Date.now(),
                          });
                          const updated = await loadEvidenceForPlot(selectedPlot.id);
                          setEvidence(updated);
                          logAuditEvent({
                            userId: farmer?.id,
                            eventType: 'plot_evidence_added',
                            payload: {
                              plotId: selectedPlot.id,
                              kind,
                              uri: asset.uri,
                              name: asset.name ?? null,
                              mimeType: asset.mimeType ?? null,
                            },
                          });
                          loadLocalAuditEvents({ limit: 50 })
                            .then(setLocalAuditEvents)
                            .catch(() => undefined);
                        }}
                      />
                    </View>
                  ))}

                  {evidence.length > 0 ? (
                    <View style={{ marginTop: 8 }}>
                      <ThemedText type="defaultSemiBold">Latest evidence</ThemedText>
                      <View style={{ gap: 10, marginTop: 10 }}>
                        {evidence.slice(0, 6).map((ev) => (
                          <Card key={ev.id} variant="outlined" style={styles.rowCard}>
                            <View style={styles.rowHeader}>
                              <ThemedText type="defaultSemiBold">
                                {ev.label ?? ev.mimeType ?? 'Evidence item'}
                              </ThemedText>
                              <Badge variant="default" size="sm">
                                {String(ev.kind)}
                              </Badge>
                            </View>
                            <ThemedText type="caption">
                              {new Date(ev.takenAt).toLocaleDateString()}
                            </ThemedText>
                          </Card>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  <View style={{ marginTop: 8 }}>
                    <Button
                      title="Sync evidence metadata to backend"
                      onPress={async () => {
                        if (!selectedPlot) return;
                        if (evidenceReason.trim().length === 0) {
                          setSyncMessage('Reason is required to sync evidence metadata.');
                          return;
                        }
                        setSyncMessage(null);
                        try {
                          if (!serverPlotId) {
                            setSyncMessage(
                              'Upload this plot to Tracebud first (Tracebud server card above), then sync evidence.',
                            );
                            return;
                          }
                          const items = evidence
                            .filter((ev) => ev.plotId === selectedPlot.id)
                            .map((ev) => ({
                              kind: ev.kind,
                              uri: ev.uri,
                              label: ev.label ?? null,
                              mimeType: ev.mimeType ?? null,
                              takenAt: ev.takenAt,
                            }));

                          // Sync per-kind so server audit stays structured.
                          const kinds: PlotEvidenceKind[] = [
                            'fpic_repository',
                            'protected_area_permit',
                            'labor_evidence',
                            'tenure_evidence',
                          ];
                          for (const k of kinds) {
                            const subset = items.filter((i) => i.kind === k);
                            if (subset.length === 0) continue;
                            await syncPlotEvidenceToBackend({
                              plotId: serverPlotId,
                              kind: k,
                              items: subset,
                              reason: evidenceReason.trim(),
                              note: 'Evidence repository sync from device',
                            });
                          }
                          setSyncMessage('Evidence metadata synced to backend.');
                        } catch (e) {
                          enqueuePendingSync({
                            createdAt: Date.now(),
                            actionType: 'evidence_sync',
                            payloadJson: JSON.stringify({
                              plotId: selectedPlot.id,
                              reason: evidenceReason.trim(),
                            }),
                            lastError: e instanceof Error ? e.message : String(e),
                          });
                          setSyncMessage(
                            e instanceof Error
                              ? `Offline: queued evidence sync. (${e.message})`
                              : 'Offline: queued evidence sync.',
                          );
                        }
                      }}
                    />
                  </View>
                </View>
                <Input
                  label="Reason for backend sync (required to sync legality)"
                  placeholder="e.g. land title verified, corrected entry…"
                  value={legalSyncReason}
                  onChangeText={setLegalSyncReason}
                  containerStyle={{ marginTop: 10 }}
                />
                <View style={{ marginTop: 8 }}>
                  <Button
                    title="Add land title photo"
                    onPress={async () => {
                      if (!selectedPlot) return;

                      const { status } =
                        await ImagePicker.requestCameraPermissionsAsync();
                      if (status !== 'granted') {
                        return;
                      }

                      const result = await ImagePicker.launchCameraAsync({
                        quality: 0.6,
                      });

                      if (result.canceled || !result.assets?.[0]?.uri) {
                        return;
                      }

                      const uri = result.assets[0].uri;
                      const takenAt = Date.now();

                      persistPlotTitlePhoto({
                        plotId: selectedPlot.id,
                        uri,
                        takenAt,
                      });

                      const updated = await loadTitlePhotosForPlot(
                        selectedPlot.id,
                      );
                      setTitlePhotos(updated);
                    }}
                  />
                </View>
                {titlePhotos.length > 0 && (
                  <View style={styles.photoRow}>
                    {titlePhotos.slice(0, 4).map((p) => (
                      <Image
                        key={p.id}
                        source={{ uri: p.uri }}
                        style={styles.photoThumb}
                      />
                    ))}
                  </View>
                )}
                <View style={{ marginTop: 8 }}>
                  <Button
                    title="Sync legality & photo metadata"
                    onPress={async () => {
                      if (!selectedPlot) return;
                      setSyncMessage(null);
                      try {
                        if (!serverPlotId) {
                          setSyncMessage(
                            'Upload this plot to Tracebud first (Tracebud server card above), then sync legality.',
                          );
                          return;
                        }
                        if (photos.length < 4) {
                          setSyncMessage(
                            'Ground-truth photo vault requires at least 4 photos (360°). Add more ground-truth photos before syncing.',
                          );
                          return;
                        }
                        const reasonForSync =
                          legalSyncReason.trim() ||
                          lastSavedLegalReason ||
                          'Synced legality evidence from device';
                        if (!reasonForSync || reasonForSync.trim().length === 0) {
                          setSyncMessage('Reason is required to sync legality metadata.');
                          return;
                        }

                        await syncPlotLegalToBackend({
                          plotId: serverPlotId,
                          cadastralKey: cadastralKey.trim() || null,
                          informalTenure: informalTenure ? true : null,
                          informalTenureNote: informalTenureNote.trim() || null,
                          reason: reasonForSync,
                        });

                        const baseMeta = {
                          cadastralKey: cadastralKey.trim() || null,
                          informalTenure: informalTenure ? true : null,
                          informalTenureNote: informalTenureNote.trim() || null,
                        };
                        await syncPlotPhotosToBackend({
                          plotId: serverPlotId,
                          kind: 'ground_truth',
                          photos: photos.map((p) => ({
                            ...baseMeta,
                            uri: p.uri,
                            takenAt: p.takenAt,
                            latitude: p.latitude ?? null,
                            longitude: p.longitude ?? null,
                          })),
                          note: 'Ground-truth photos sync from device',
                        });
                        await syncPlotPhotosToBackend({
                          plotId: serverPlotId,
                          kind: 'land_title',
                          photos: titlePhotos.map((p) => ({
                            ...baseMeta,
                            uri: p.uri,
                            takenAt: p.takenAt,
                          })),
                          note: 'Land title photos sync from device',
                        });
                        setSyncMessage('Legality data synced to backend.');
                      } catch (e) {
                      // queue for retry
                      enqueuePendingSync({
                        createdAt: Date.now(),
                        actionType: 'photos_sync',
                        payloadJson: JSON.stringify({
                          // also include legality evidence for later manual retry
                          legal: {
                            cadastralKey: cadastralKey.trim() || null,
                            informalTenure: informalTenure ? true : null,
                            informalTenureNote: informalTenureNote.trim() || null,
                            reason: legalSyncReason.trim() || lastSavedLegalReason || null,
                          },
                          plotId: selectedPlot.id,
                          kind: 'ground_truth',
                          photos: photos.map((p) => ({
                            cadastralKey: cadastralKey.trim() || null,
                            informalTenure: informalTenure ? true : null,
                            informalTenureNote: informalTenureNote.trim() || null,
                            uri: p.uri,
                            takenAt: p.takenAt,
                            latitude: p.latitude ?? null,
                            longitude: p.longitude ?? null,
                          })),
                          note: 'Ground-truth photos sync from device',
                        }),
                        lastError: e instanceof Error ? e.message : String(e),
                      });
                      enqueuePendingSync({
                        createdAt: Date.now(),
                        actionType: 'photos_sync',
                        payloadJson: JSON.stringify({
                          plotId: selectedPlot.id,
                          kind: 'land_title',
                          photos: titlePhotos.map((p) => ({
                            cadastralKey: cadastralKey.trim() || null,
                            informalTenure: informalTenure ? true : null,
                            informalTenureNote: informalTenureNote.trim() || null,
                            uri: p.uri,
                            takenAt: p.takenAt,
                          })),
                          note: 'Land title photos sync from device',
                        }),
                        lastError: e instanceof Error ? e.message : String(e),
                      });
                      refreshPendingCount();
                        setSyncMessage(
                          e instanceof Error
                            ? e.message
                            : 'Could not sync legality data.',
                        );
                      }
                    }}
                  />
                  {syncMessage ? (
                    <ThemedText type="caption">{syncMessage}</ThemedText>
                  ) : null}
                </View>
              </View>
            </>
          )}
      </>

      {farmer && backendPlots.length > 0 && (
        <Card style={styles.card}>
          <ThemedText type="subtitle">{t('record_harvest_title')}</ThemedText>
          {selectedBackendRejected ? (
            <>
              {selectedBackendPlot?.indigenous_overlap ? (
                <ThemedText type="caption">
                  Required evidence: FPIC repository document(s) for indigenous overlap.
                </ThemedText>
              ) : null}
              {selectedBackendPlot?.sinaph_overlap ? (
                <ThemedText type="caption">
                  Required evidence: permit / management plan document(s) for protected-area overlap.
                </ThemedText>
              ) : null}
              <Input
                label="Override reason (required when plot has an overlap flag)"
                placeholder="e.g. buffer-zone permit reviewed, management plan attached, allowed agroforestry…"
                value={overlapOverrideReason}
                onChangeText={setOverlapOverrideReason}
                containerStyle={{ marginTop: 10 }}
              />
            </>
          ) : null}
          <Input
            label={t('kg_delivered')}
            placeholder="e.g. 500"
            keyboardType="numeric"
            value={kgInput}
            onChangeText={setKgInput}
            containerStyle={{ marginTop: 10 }}
          />
          <Button
            title={selectedBackendRejected ? 'Record harvest (Amber override)' : 'Record harvest'}
            onPress={async () => {
              if (!kgInput.trim()) return;
              const kg = Number(kgInput.trim().replace(',', '.'));
              if (!selectedPlotId || Number.isNaN(kg) || kg <= 0) {
                return;
              }
              if (selectedBackendRejected) {
                const ev = evidence.filter((e) => e.plotId === selectedPlotId);
                if (selectedBackendPlot?.indigenous_overlap) {
                  const hasFpic = ev.some((e) => e.kind === 'fpic_repository');
                  if (!hasFpic) {
                    setHarvestMessage(
                      'FPIC evidence is required for indigenous overlap. Add at least one FPIC doc/photo in Evidence repository.',
                    );
                    return;
                  }
                }
                if (selectedBackendPlot?.sinaph_overlap) {
                  const hasPermit = ev.some((e) => e.kind === 'protected_area_permit');
                  if (!hasPermit) {
                    setHarvestMessage(
                      'Permit/management-plan evidence is required for protected-area overlap. Add at least one permit doc/photo in Evidence repository.',
                    );
                    return;
                  }
                }
              }
              if (selectedBackendRejected && overlapOverrideReason.trim().length === 0) {
                setHarvestMessage('Override reason is required for overlap-flagged plots.');
                return;
              }
              if (!serverPlotId) {
                setHarvestMessage(
                  'Upload the selected plot to Tracebud first (see “Tracebud server” on this plot), then record harvest.',
                );
                return;
              }
              setHarvestMessage(null);
              try {
                await postHarvestToBackend({
                  farmerId: farmer.id,
                  plotId: serverPlotId,
                  kg,
                  note: selectedBackendRejected
                    ? `AMBER_OVERRIDE: ${overlapOverrideReason.trim()}`
                    : undefined,
                });
                setHarvestMessage('Harvest recorded and voucher created.');
                setKgInput('');
                if (selectedBackendRejected) setOverlapOverrideReason('');
              } catch (e) {
                enqueuePendingSync({
                  createdAt: Date.now(),
                  actionType: 'harvest',
                  payloadJson: JSON.stringify({
                    farmerId: farmer.id,
                    plotId: selectedPlotId,
                    kg,
                    note: selectedBackendRejected
                      ? `AMBER_OVERRIDE: ${overlapOverrideReason.trim()}`
                      : undefined,
                  }),
                  lastError: e instanceof Error ? e.message : String(e),
                });
                refreshPendingCount();
                setHarvestMessage(String(e));
              }
            }}
          />
          {harvestMessage ? (
            <ThemedText type="caption">{harvestMessage}</ThemedText>
          ) : null}
        </Card>
      )}

      {loadingBackend ? (
        <Card style={styles.card}>
          <ActivityIndicator />
          <ThemedText type="caption">Loading synced plots from backend…</ThemedText>
        </Card>
      ) : backendPlots.length > 0 ? (
        <Card style={styles.card}>
          <ThemedText type="subtitle">{t('synced_plots')}</ThemedText>
          {backendPlots.some((p) => p.indigenous_overlap) && farmer?.fpicConsent !== true ? (
            <ThemedView style={styles.fpicWarning}>
              <ThemedText type="defaultSemiBold">FPIC required</ThemedText>
              <ThemedText type="caption">
                One or more plots overlap an indigenous territory. FPIC consent must be recorded for compliance.
              </ThemedText>
            </ThemedView>
          ) : null}
          {(() => {
            const green = backendPlots.filter((p) => p.status === 'compliant').length;
            const amber = backendPlots.filter(
              (p) => p.status === 'degradation_risk',
            ).length;
            const red = backendPlots.filter(
              (p) => p.status === 'deforestation_detected',
            ).length;
            return (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <Badge variant="success" size="sm">
                  {green} Green
                </Badge>
                <Badge variant="warning" size="sm">
                  {amber} Amber
                </Badge>
                <Badge variant="error" size="sm">
                  {red} Red
                </Badge>
              </View>
            );
          })()}
          <View style={{ gap: 10, marginTop: 10 }}>
            {backendPlots.map((p) => (
              <Card key={p.id} variant="outlined" style={styles.rowCard}>
                <View style={styles.rowHeader}>
                  <ThemedText type="defaultSemiBold">
                    {p.name} • {Number(p.area_ha).toFixed(4)} ha
                  </ThemedText>
                  <ComplianceBadge status={p.status} />
                </View>
                <ThemedText type="caption">
                  Kind: {p.kind}
                  {p.sinaph_overlap ? ' • Protected area overlap' : ''}
                  {p.indigenous_overlap ? ' • Indigenous territory overlap' : ''}
                </ThemedText>
                <View style={{ gap: 8, marginTop: 10 }}>
                  <Button
                    title={complianceBusyId === p.id ? 'Running compliance check…' : 'Run compliance check'}
                    disabled={!!complianceBusyId}
                    variant="secondary"
                    onPress={async () => {
                      if (!farmer) return;
                      setComplianceBusyId(p.id);
                      try {
                        await runComplianceCheckForPlot(p.id);
                        const rows = await fetchPlotsForFarmer(farmer.id);
                        setBackendPlots(rows ?? []);
                        setBackendError(null);
                      } catch (e) {
                        setBackendError(
                          e instanceof Error
                            ? e.message
                            : 'Compliance check failed. Please try again later.',
                        );
                      } finally {
                        setComplianceBusyId(null);
                      }
                    }}
                  />
                  <Button
                    title={gfwBusyId === p.id ? 'Running GFW check…' : 'Run GFW check (alerts)'}
                    disabled={!!gfwBusyId}
                    variant="secondary"
                    onPress={async () => {
                      if (!farmer) return;
                      setGfwBusyId(p.id);
                      try {
                        await runGfwCheckForPlot(p.id);
                        const auditRows = await fetchAuditForFarmer(farmer.id).catch(() => []);
                        setAuditEvents(auditRows ?? []);
                        setBackendError(null);
                      } catch (e) {
                        setBackendError(e instanceof Error ? e.message : String(e));
                      } finally {
                        setGfwBusyId(null);
                      }
                    }}
                  />
                </View>
              </Card>
            ))}
          </View>
        </Card>
      ) : null}

      {vouchers.length > 0 && (
        <Card style={styles.card}>
          <ThemedText type="subtitle">{t('vouchers_title')}</ThemedText>
          <Button
            title="Scan voucher QR"
            variant="secondary"
            onPress={() => {
              setScanError(null);
              setScanResult(null);
              setScannerActive(true);
            }}
          />
          {scannerActive && (
            <View style={styles.scannerBox}>
              {cameraPermission?.granted === false ? (
                <ThemedText type="caption">Camera permission denied.</ThemedText>
              ) : (
                <CameraView
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={async ({ data }) => {
                    setScannerActive(false);
                    const qrRef = String(data ?? '').trim();
                    if (!qrRef) {
                      setScanError('Could not read QR code.');
                      return;
                    }
                    try {
                      const result = await fetchVoucherByQrRef(qrRef);
                      setScanResult(result);
                      setScanError(null);
                    } catch (e) {
                      setScanResult(null);
                      setScanError(e instanceof Error ? e.message : String(e));
                    }
                  }}
                  style={{ width: '100%', height: 220 }}
                />
              )}
              <View style={{ marginTop: 8 }}>
                <Button title="Cancel" variant="ghost" onPress={() => setScannerActive(false)} />
              </View>
            </View>
          )}
          {scanError ? (
            <ThemedText type="caption">{scanError}</ThemedText>
          ) : scanResult ? (
            <View style={styles.scanResultBox}>
              <ThemedText type="defaultSemiBold">Scan result</ThemedText>
              <ThemedText type="caption">
                Voucher: {scanResult.voucher?.qrRef ?? '—'} – {scanResult.voucher?.status ?? '—'}
              </ThemedText>
              {scanResult.ddsPackage ? (
                <ThemedText type="caption">
                  In DDS package: {String(scanResult.ddsPackage.id).slice(0, 8)}… –{' '}
                  {scanResult.ddsPackage.status}
                </ThemedText>
              ) : (
                <ThemedText type="caption">Not yet packaged.</ThemedText>
              )}
            </View>
          ) : null}
          <View style={{ gap: 10, marginTop: 10 }}>
            {vouchers.map((v) => {
              const statusVariant =
                v.status === 'active'
                  ? 'success'
                  : v.status === 'void'
                    ? 'error'
                    : 'default';
              return (
                <Pressable key={v.id} onPress={() => setSelectedVoucherId(v.id)}>
                  <Card variant={selectedVoucherId === v.id ? 'elevated' : 'outlined'} style={styles.rowCard}>
                    <View style={styles.rowHeader}>
                      <ThemedText type="defaultSemiBold">{v.id.slice(0, 8)}…</ThemedText>
                      <Badge variant={statusVariant as any} size="sm">
                        {String(v.status)}
                      </Badge>
                    </View>
                    <ThemedText type="caption">
                      {new Date(v.created_at).toLocaleDateString()}
                    </ThemedText>
                  </Card>
                </Pressable>
              );
            })}
          </View>
          {selectedVoucherId && (
            <View style={{ marginTop: 8, alignItems: 'center' }}>
              <ThemedText type="caption">Voucher QR</ThemedText>
              {(() => {
                const v = vouchers.find((vv) => vv.id === selectedVoucherId);
                if (!v?.qr_code_ref) return null;
                return (
                  <QRCode value={String(v.qr_code_ref)} size={140} />
                );
              })()}
            </View>
          )}
        </Card>
      )}

      {(auditEvents.length > 0 || localAuditEvents.length > 0) && (
        <Card style={styles.card}>
          <ThemedText type="subtitle">{t('recent_activity')}</ThemedText>
          {(() => {
            const server = auditEvents.map((e: any) => ({
              key: `server-${e.id}`,
              timestamp: e.timestamp,
              eventType: e.event_type,
              source: 'server' as const,
            }));
            const local = localAuditEvents.map((e) => ({
              key: `local-${e.id}`,
              timestamp: e.timestamp,
              eventType: e.eventType,
              source: 'local' as const,
            }));
            const combined = [...server, ...local].sort((a, b) => {
              const ta = new Date(a.timestamp).getTime();
              const tb = new Date(b.timestamp).getTime();
              return tb - ta;
            });
            return (
              <View style={{ gap: 10, marginTop: 10 }}>
                {combined.slice(0, 12).map((e) => (
                  <Card key={e.key} variant="outlined" style={styles.rowCard}>
                    <View style={styles.rowHeader}>
                      <ThemedText type="defaultSemiBold">{e.eventType}</ThemedText>
                      <Badge variant={e.source === 'local' ? 'default' : 'info'} size="sm">
                        {e.source}
                      </Badge>
                    </View>
                    <ThemedText type="caption">{new Date(e.timestamp).toLocaleString()}</ThemedText>
                  </Card>
                ))}
              </View>
            );
          })()}
        </Card>
      )}

      {ddsPackages.length > 0 && (
        <Card style={styles.card}>
          <ThemedText type="subtitle">{t('dds_title')}</ThemedText>
          <View style={{ gap: 10, marginTop: 10 }}>
            {ddsPackages.map((p) => {
              const statusVariant =
                p.status === 'submitted' ? 'success' : p.status === 'draft' ? 'warning' : 'default';
              return (
                <Card key={p.id} variant="outlined" style={styles.rowCard}>
                  <View style={styles.rowHeader}>
                    <ThemedText type="defaultSemiBold">{p.id.slice(0, 8)}…</ThemedText>
                    <Badge variant={statusVariant as any} size="sm">
                      {String(p.status)}
                    </Badge>
                  </View>
                  {p.traces_reference ? (
                    <ThemedText type="caption">TRACES ref: {p.traces_reference}</ThemedText>
                  ) : (
                    <ThemedText type="caption">TRACES ref: —</ThemedText>
                  )}
                </Card>
              );
            })}
          </View>
          {farmer && vouchers.length > 0 && (
            <Button
              title="Create DDS package from active vouchers"
              variant="secondary"
              onPress={async () => {
                const activeIds = vouchers
                  .filter((v) => v.status === 'active')
                  .map((v) => v.id);
                if (activeIds.length === 0) {
                  return;
                }
                try {
                  await createDdsPackageForFarmer({
                    farmerId: farmer.id,
                    voucherIds: activeIds,
                    label: `Package ${new Date().toISOString().slice(0, 10)}`,
                  });
                  const pkgs = await fetchDdsPackagesForFarmer(farmer.id);
                  setDdsPackages(pkgs ?? []);
                  setBackendError(null);
                } catch (e) {
                  setBackendError(
                    e instanceof Error
                      ? e.message
                      : 'Could not create DDS package. Please try again.',
                  );
                }
              }}
            />
          )}
          {farmer && (
            <Button
              title={submittingPackage ? 'Submitting latest package…' : 'Submit latest package'}
              disabled={submittingPackage}
              variant="secondary"
              onPress={async () => {
                if (!farmer) return;
                const unsent = ddsPackages.filter(
                  (p) => p.status !== 'submitted',
                );
                if (unsent.length === 0) {
                  return;
                }
                // Pick the latest by created_at if available, otherwise last in the array
                const latest =
                  unsent
                    .slice()
                    .sort((a, b) => {
                      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
                      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
                      return db - da;
                    })[0] ?? unsent[unsent.length - 1];

                setSubmittingPackage(true);
                try {
                  await submitDdsPackage(latest.id);
                  const pkgs = await fetchDdsPackagesForFarmer(farmer.id);
                  setDdsPackages(pkgs ?? []);
                  setBackendError(null);
                } catch (e) {
                  setBackendError(
                    e instanceof Error
                      ? e.message
                      : 'Could not submit package. Please try again.',
                  );
                } finally {
                  setSubmittingPackage(false);
                }
              }}
            />
          )}
          {farmer && ddsPackages.length > 0 && (
            <Button
              title="Download latest DDS JSON (TRACES-style)"
              variant="outline"
              onPress={async () => {
                if (!farmer) return;
                const latest =
                  ddsPackages
                    .slice()
                    .sort((a, b) => {
                      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
                      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
                      return db - da;
                    })[0] ?? ddsPackages[ddsPackages.length - 1];
                try {
                  const json = await fetchDdsPackageTracesJson(latest.id);
                  console.log('DDS TRACES JSON', json);
                  setBackendError(null);
                } catch (e) {
                  setBackendError(
                    e instanceof Error
                      ? e.message
                      : 'Could not load TRACES JSON. Please try again.',
                  );
                }
              }}
            />
          )}
        </Card>
      )}
      </ThemedScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },
  profilePill: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
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
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  card: {
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  backendSection: {
    marginTop: 16,
    gap: 4,
  },
  errorBanner: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  harvestSection: {
    marginTop: 16,
    gap: 8,
  },
  plotList: {
    marginTop: 8,
    gap: 10,
  },
  plotCard: {
    padding: 12,
  },
  plotCardSelected: {},
  plotCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  plotInfo: {
    flex: 1,
    gap: 2,
  },
  discrepancyText: {
    marginTop: 6,
  },
  mapContainer: {
    marginTop: 12,
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  map: {
    flex: 1,
  },
  photoRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  syncedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  syncRow: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 8,
    gap: 4,
  },
  fpicWarning: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    gap: 2,
  },
  rejectionBanner: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    gap: 2,
  },
  scannerBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    gap: 8,
  },
  scanResultBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 2,
  },
  rowCard: {
    padding: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  containerCompact: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  plotProtoCard: {
    borderRadius: 18,
    padding: 14,
  },
  plotProtoCardSelected: {
    borderColor: '#74D7B8',
    borderWidth: 1.8,
  },
  plotMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  plotMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plotCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
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

import { Alert, Image, Linking, Platform, Pressable, ScrollView, Switch, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { requestForegroundLocationOrAlert } from '@/features/permissions/locationPermission';
import {
  alertPushPermissionDenied,
  getPushPermissionStatus,
  type PushPermissionResult,
} from '@/features/permissions/pushPermission';
import { registerFarmerPushToken, unregisterFarmerPushToken } from '@/features/notifications/registerFarmerPushToken';
import { PUSH_NOTIFICATIONS_OPT_IN_KEY } from '@/features/notifications/pushSettings';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { CompactTabHeader, TabHeaderSpacer } from '@/components/layout/CompactTabHeader';
import { ThemedText } from '@/components/themed-text';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  getTracebudApiBaseUrl,
} from '@/features/api/postPlot';
import { ensureFieldProducerBootstrapped } from '@/features/api/fieldAppBootstrap';
import {
  getAuthCredentials,
  hasSyncAuthSession,
  hydrateSyncAuthFromSettings,
  isSyncAuthSignedOutOnDevice,
} from '@/features/api/syncAuthSession';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getSetting,
  compactDuplicatePendingSyncActions,
  adoptOnDeviceFarmerScope,
  loadPendingSyncActions,
  loadPlotServerLinks,
  loadAppState,
  setSetting,
  type PendingSyncAction,
} from '@/features/state/persistence';
import {
  listUnsyncedLocalPlots,
  subscribeServerPlotSyncChanged,
} from '@/features/sync/plotServerSync';
import {
  prepareFieldSyncContext,
} from '@/features/sync/resolveFieldSyncScope';
import { fetchServerPlotListForUi, peekServerPlotListCache } from '@/features/sync/serverPlotListCache';
import { openFieldSyncSession } from '@/features/sync/runFieldSyncSession';
import { runFieldSyncPipeline } from '@/features/sync/runFieldSyncPipeline';
import { reportSyncFailure } from '@/features/sync/reportSyncFailure';
import {
  formatSyncFailureStepLabel,
  formatSyncFailureUserMessage,
} from '@/features/sync/mapSyncFailureMessage';
import { classifyQueueSyncFailure } from '@/features/sync/syncFailure';
import {
  getSyncQueueLockSnapshot,
  setSyncQueuePhase,
  subscribeSyncQueueLock,
  SyncQueueLockTimeoutError,
  withSyncQueueLock,
} from '@/features/sync/syncQueueMutex';
import {
  SYNC_LOCK_WAIT_MS,
  SYNC_MANUAL_OPERATION_MS,
  SyncOperationTimeoutError,
  withSyncOperationTimeout,
} from '@/features/sync/syncOperationLimits';
import { probeTracebudApiReachable } from '@/features/network/pingTracebudApi';
import {
  isPlotFetchAuthFailure,
  isPlotFetchReachabilityFailure,
} from '@/features/sync/plotFetchFailure';
import { subscribeSyncOperationOutcome, emitSyncOperationOutcome } from '@/features/sync/syncOperationOutcome';
import { syncTimedOutMessage } from '@/features/errors/mapApiErrorToUserMessage';
import { resolveSyncOpenPlotId, resolveSyncSupportMailto } from '@/features/sync/formatSyncNowUserMessage';
import { resolveSyncAttentionMessage } from '@/features/sync/resolveSyncAttentionMessage';
import { resolveBackupStatusDisplay } from '@/features/sync/backupStatusDisplay';
import {
  primaryGeometryBlockForWhy,
  resolveGeometrySyncWhyExplain,
} from '@/features/compliance/plotGeometrySyncExplain';
import { measureTotalSyncPending, type TotalSyncPendingSnapshot } from '@/features/sync/measureTotalSyncPending';
import {
  appendLandDocsReminderToSyncCompleteMessage,
  listSyncedPlotNamesWithLocalLandDocsOnly,
} from '@/features/sync/landDocUploadReminder';
import { shouldShowBackupAttentionPanel } from '@/features/sync/backupAttentionSummary';
import {
  formatCloudParityHints,
  measureCloudParitySummary,
} from '@/features/sync/measureCloudParitySummary';
import { isLocalLanSyncApi } from '@/features/dev/syncApiTarget';
import {
  isNetworkReachabilityFailure,
  resolveSyncConnectivityUserMessage,
  resolveSyncReachFailedShortMessage,
} from '@/features/sync/syncReachabilityMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brand } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { createSettingsScreenStyles } from '@/screenStyles/settingsScreenStyles';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import { SetPasswordCard } from '@/components/auth/SetPasswordCard';
import {
  footprintBytesToMb,
  measureTracebudStorageFootprint,
  type TracebudStorageFootprint,
} from '@/features/storage/measureTracebudFootprint';
import { useAppState, type Plot } from '@/features/state/AppStateContext';
import { roundWgs84Coordinate } from '@/features/geo/coordinates';
import { Input } from '@/components/ui/input';
import { useFocusEffect } from '@react-navigation/native';
import type { PendingSyncAttemptScope } from '@/features/sync/processPendingSyncQueue';

const ALL_QUEUE_ACTION_TYPES: PendingSyncAction['actionType'][] = [
  'harvest',
  'photos_sync',
  'evidence_sync',
  'audit_sync',
  'consent_approve',
  'consent_deny',
  'consent_revoke',
];

const SYNC_DRAIN_ACTION_TYPES: PendingSyncAction['actionType'][] = [
  'harvest',
  'photos_sync',
  'evidence_sync',
  'audit_sync',
];

const CONSENT_QUEUE_ACTION_TYPES: PendingSyncAction['actionType'][] = [
  'consent_approve',
  'consent_deny',
  'consent_revoke',
];

function isConsentQueueActionType(
  actionType: PendingSyncAction['actionType'],
): boolean {
  return CONSENT_QUEUE_ACTION_TYPES.includes(actionType);
}

const RETRY_BACKOFF_BASE_MS = 5000;
const RETRY_BACKOFF_MAX_MS = 5 * 60 * 1000;

function computeRetryBackoffMs(attempts: number): number {
  if (attempts <= 0) return 0;
  return Math.min(RETRY_BACKOFF_MAX_MS, RETRY_BACKOFF_BASE_MS * 2 ** (attempts - 1));
}

const fsAny = FileSystem as unknown as {
  documentDirectory?: string | null;
  cacheDirectory?: string | null;
};

export default function SettingsScreen() {
  const { languageCode, openLanguagePicker, t } = useLanguage();
  const params = useLocalSearchParams<{ focus?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const syncSectionY = useRef(0);
  const { farmer, farmerDisplayName, plots, setFarmer, updateFarmerProfilePhoto, reloadFromDisk } =
    useAppState();
  const { refreshAuth, openSignIn, isSignedIn, signOutOnDevice } = useSignInSheet();
  const [nameInput, setNameInput] = useState('');
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createSettingsScreenStyles);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncMessageKind, setSyncMessageKind] = useState<'success' | 'error' | null>(null);
  const [cloudParityHints, setCloudParityHints] = useState<string[]>([]);
  const [syncSupportMailto, setSyncSupportMailto] = useState<string | null>(null);
  const [syncOpenPlotId, setSyncOpenPlotId] = useState<string | null>(null);
  const [syncNowBusy, setSyncNowBusy] = useState(false);
  const [syncLockSnapshot, setSyncLockSnapshot] = useState(getSyncQueueLockSnapshot);
  /** SQLite queue: harvests, photo sync, evidence sync (not plot geometry upload). */
  const [queuePendingCount, setQueuePendingCount] = useState(0);
  const [queueRetryingCount, setQueueRetryingCount] = useState(0);
  const [queueMaxAttempts, setQueueMaxAttempts] = useState(0);
  const [queueLastError, setQueueLastError] = useState<string | null>(null);
  const [queueLastErrorActionType, setQueueLastErrorActionType] = useState<
    PendingSyncAction['actionType'] | null
  >(null);
  const [queueNextRetrySeconds, setQueueNextRetrySeconds] = useState<number | null>(null);
  const [queueCountByActionType, setQueueCountByActionType] = useState<
    Record<PendingSyncAction['actionType'], number>
  >({
    harvest: 0,
    photos_sync: 0,
    evidence_sync: 0,
    audit_sync: 0,
    consent_approve: 0,
    consent_deny: 0,
    consent_revoke: 0,
  });
  /** Local plots with no matching server row (by name). */
  const [backendPlots, setBackendPlots] = useState<unknown[]>([]);
  const [plotServerLinks, setPlotServerLinks] = useState<Record<string, string>>({});
  const [measuredSyncPending, setMeasuredSyncPending] = useState<TotalSyncPendingSnapshot | null>(null);
  const [plotsFetchState, setPlotsFetchState] = useState<'idle' | 'loading' | 'ok' | 'failed'>('idle');
  const [syncAccessFailure, setSyncAccessFailure] = useState<
    'network' | 'session_expired' | null
  >(null);
  const [syncEmail, setSyncEmail] = useState('');
  const [profileEditing, setProfileEditing] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [helpTipsOpen, setHelpTipsOpen] = useState(false);
  const [backupTechOpen, setBackupTechOpen] = useState(false);
  const [queueActionFilter, setQueueActionFilter] = useState<
    Record<PendingSyncAction['actionType'], boolean>
  >({
    harvest: true,
    photos_sync: true,
    evidence_sync: true,
    audit_sync: true,
    consent_approve: true,
    consent_deny: true,
    consent_revoke: true,
  });
  const [queueAttemptScope, setQueueAttemptScope] = useState<PendingSyncAttemptScope>('all');
  const [storageFootprint, setStorageFootprint] = useState<TracebudStorageFootprint | null>(null);
  const [storageMeasuring, setStorageMeasuring] = useState(false);
  const [queueSmartSweepEnabled, setQueueSmartSweepEnabled] = useState(false);
  const [queueSmartSweepCap, setQueueSmartSweepCap] = useState<25 | 50 | 100 | 200>(100);
  const [pushPermission, setPushPermission] = useState<PushPermissionResult | 'unknown'>('unknown');
  const [pushOptIn, setPushOptIn] = useState(true);
  const [pushRegisterBusy, setPushRegisterBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  /** Keep backup status chip stable until sync finishes (avoid per-plot/queue flicker). */
  const freezeSyncMetricsDisplayRef = useRef(false);
  const measuredSyncPendingRef = useRef<TotalSyncPendingSnapshot | null>(null);

  useEffect(() => {
    measuredSyncPendingRef.current = measuredSyncPending;
  }, [measuredSyncPending]);

  const refreshPushPermission = useCallback(async () => {
    if (Platform.OS === 'web') {
      setPushPermission('unavailable');
      setPushOptIn(false);
      return;
    }
    const status = await getPushPermissionStatus();
    setPushPermission(status);
    const optIn = await getSetting(PUSH_NOTIFICATIONS_OPT_IN_KEY).catch(() => null);
    setPushOptIn(optIn !== '0');
  }, []);

  const refreshSavedSyncEmail = useCallback(async () => {
    if (await isSyncAuthSignedOutOnDevice()) {
      setSyncEmail('');
      return;
    }
    await refreshAuth();
    if (await isSyncAuthSignedOutOnDevice()) {
      setSyncEmail('');
      return;
    }
    const { email } = getAuthCredentials();
    setSyncEmail(email?.trim() ?? '');
  }, [refreshAuth]);

  const refreshSyncMetrics = useCallback(async (options?: {
    forcePlotFetch?: boolean;
    farmerId?: string;
    ownedFarmerIds?: string[];
    plots?: Plot[];
  }): Promise<TotalSyncPendingSnapshot | null> => {
    await compactDuplicatePendingSyncActions().catch(() => 0);
    const rows = await loadPendingSyncActions().catch(() => []);
    await hydrateSyncAuthFromSettings().catch(() => undefined);
    const applyDisplay =
      !freezeSyncMetricsDisplayRef.current && !getSyncQueueLockSnapshot().locked;
    const hasSettledMetrics = measuredSyncPendingRef.current != null;

    const queueMetricsFromRows = (queueRows: PendingSyncAction[]) => {
      const retryingRows = queueRows.filter((row) => (row.attempts ?? 0) > 0);
      const latestErrored = [...retryingRows]
        .sort((a, b) => {
          if ((b.attempts ?? 0) !== (a.attempts ?? 0)) return (b.attempts ?? 0) - (a.attempts ?? 0);
          return (b.createdAt ?? 0) - (a.createdAt ?? 0);
        })
        .find((row) => typeof row.lastError === 'string' && row.lastError.trim().length > 0);
      const now = Date.now();
      const nextRetryMs = retryingRows
        .map((row) => {
          const attempts = row.attempts ?? 0;
          if (attempts <= 0) return 0;
          const lastAttemptAt = row.lastAttemptAt ?? row.createdAt ?? now;
          const readyAt = lastAttemptAt + computeRetryBackoffMs(attempts);
          return Math.max(0, readyAt - now);
        })
        .filter((ms) => ms > 0)
        .sort((a, b) => a - b)[0];
      return {
        queuePendingCount: queueRows.length,
        queueCountByActionType: queueRows.reduce<Record<PendingSyncAction['actionType'], number>>(
          (acc, row) => {
            acc[row.actionType] += 1;
            return acc;
          },
          {
            harvest: 0,
            photos_sync: 0,
            evidence_sync: 0,
            audit_sync: 0,
            consent_approve: 0,
            consent_deny: 0,
            consent_revoke: 0,
          },
        ),
        queueRetryingCount: retryingRows.length,
        queueMaxAttempts: queueRows.reduce((max, row) => Math.max(max, row.attempts ?? 0), 0),
        queueLastError: latestErrored?.lastError?.trim() ?? null,
        queueLastErrorActionType: latestErrored?.actionType ?? null,
        queueNextRetrySeconds: nextRetryMs != null ? Math.ceil(nextRetryMs / 1000) : null,
      };
    };

    const publishSyncMetricsDisplay = (snapshot: {
      queueRows: PendingSyncAction[];
      pending: TotalSyncPendingSnapshot;
      backendPlots: unknown[];
      plotServerLinks: Record<string, string>;
      plotsFetchState: typeof plotsFetchState;
      syncAccessFailure: typeof syncAccessFailure;
    }) => {
      const queueMetrics = queueMetricsFromRows(snapshot.queueRows);
      setQueuePendingCount(queueMetrics.queuePendingCount);
      setQueueCountByActionType(queueMetrics.queueCountByActionType);
      setQueueRetryingCount(queueMetrics.queueRetryingCount);
      setQueueMaxAttempts(queueMetrics.queueMaxAttempts);
      setQueueLastError(queueMetrics.queueLastError);
      setQueueLastErrorActionType(queueMetrics.queueLastErrorActionType);
      setQueueNextRetrySeconds(queueMetrics.queueNextRetrySeconds);
      setBackendPlots(snapshot.backendPlots);
      setPlotServerLinks(snapshot.plotServerLinks);
      setMeasuredSyncPending(snapshot.pending);
      setPlotsFetchState(snapshot.plotsFetchState);
      setSyncAccessFailure(snapshot.syncAccessFailure);
    };

    const plotSnapshot = options?.plots ?? plots;
    let profileFarmerId = options?.farmerId?.trim() || farmer?.id?.trim() || '';
    let ownedFarmerIds = options?.ownedFarmerIds;
    let apiFarmerId = profileFarmerId;
    let plotSnapshotForSync = plotSnapshot;

    const canQueryServer = Boolean(profileFarmerId && hasSyncAuthSession());
    if (!canQueryServer) {
      const links = await loadPlotServerLinks().catch(() => ({}));
      const pending: TotalSyncPendingSnapshot = {
        queuePendingCount: rows.length,
        unsyncedPlotCount: 0,
        blockedPlotCount: 0,
        total: rows.length,
        unsyncedPlotNames: [],
        blockedPlots: [],
      };
      if (applyDisplay) {
        publishSyncMetricsDisplay({
          queueRows: rows,
          pending,
          backendPlots: [],
          plotServerLinks: links,
          plotsFetchState: 'idle',
          syncAccessFailure: null,
        });
      }
      return applyDisplay ? pending : null;
    }

    if (!ownedFarmerIds?.length) {
      try {
        const syncContext = await prepareFieldSyncContext({
          profileFarmerId,
          localPlots: plotSnapshotForSync,
        });
        apiFarmerId = syncContext.farmerId;
        ownedFarmerIds = syncContext.ownedFarmerIds;
        if (syncContext.rekeyed) {
          await reloadFromDisk();
          const diskState = await loadAppState().catch(() => null);
          if (diskState?.farmer?.id?.trim()) {
            profileFarmerId = diskState.farmer.id.trim();
            apiFarmerId = profileFarmerId;
          }
          if (diskState?.plots?.length) {
            plotSnapshotForSync = diskState.plots;
          }
        }
      } catch {
        ownedFarmerIds = ownedFarmerIds ?? [];
      }
    } else {
      apiFarmerId = profileFarmerId;
    }

    if (applyDisplay && !hasSettledMetrics) {
      setPlotsFetchState('loading');
      setSyncAccessFailure(null);
    }

    const sessionOpened = canQueryServer ? await openFieldSyncSession() : null;
    let backend: unknown[] = [];
    let nextPlotsFetchState: typeof plotsFetchState = hasSettledMetrics ? 'ok' : 'loading';
    let nextSyncAccessFailure: typeof syncAccessFailure = null;
    try {
      if (sessionOpened?.ok) {
        try {
          backend = await fetchServerPlotListForUi({
            profileFarmerId,
            localPlots: plotSnapshotForSync,
            ownedFarmerIds,
            resolvedFarmerId: apiFarmerId,
            force: options?.forcePlotFetch === true,
          });
          nextPlotsFetchState = 'ok';
          nextSyncAccessFailure = null;
        } catch (err) {
          const cached = peekServerPlotListCache({
            farmerId: apiFarmerId,
            ownedFarmerIds,
          });
          if (cached?.length) {
            backend = cached;
            nextPlotsFetchState = 'ok';
            nextSyncAccessFailure = null;
          } else {
            backend = [];
            if (isPlotFetchAuthFailure(err)) {
              nextPlotsFetchState = 'idle';
              nextSyncAccessFailure = 'session_expired';
            } else if (isPlotFetchReachabilityFailure(err)) {
              const reachable = await probeTracebudApiReachable({
                accessToken: sessionOpened.session.accessToken,
              });
              nextPlotsFetchState = reachable ? 'ok' : 'failed';
              nextSyncAccessFailure = null;
            } else {
              nextPlotsFetchState = 'ok';
              nextSyncAccessFailure = null;
            }
          }
        }
      } else if (sessionOpened && !sessionOpened.ok) {
        backend = [];
        nextPlotsFetchState = 'idle';
        nextSyncAccessFailure =
          sessionOpened.failure.cause === 'network' || sessionOpened.failure.cause === 'timeout'
            ? 'network'
            : 'session_expired';
      } else {
        backend = [];
        nextPlotsFetchState = 'idle';
        nextSyncAccessFailure = null;
      }

      const pending = await measureTotalSyncPending({
        farmerId: apiFarmerId,
        ownedFarmerIds,
        plots: plotSnapshotForSync,
        isSignedIn: true,
        forcePlotFetch: options?.forcePlotFetch === true,
      });
      const reconciledLinks =
        pending.plotServerLinks ?? (await loadPlotServerLinks().catch(() => ({})));
      const reconciledBackend = pending.backendPlots ?? backend;
      if (!applyDisplay) return pending;

      publishSyncMetricsDisplay({
        queueRows: rows,
        pending,
        backendPlots: reconciledBackend,
        plotServerLinks: reconciledLinks,
        plotsFetchState: nextPlotsFetchState,
        syncAccessFailure: nextSyncAccessFailure,
      });
      return pending;
    } finally {
      if (sessionOpened?.ok) {
        sessionOpened.end();
      }
    }
  }, [farmer, plots, reloadFromDisk]);

  const refreshCloudParity = useCallback(
    async (plotSnapshot?: Plot[]) => {
      if (!isSignedIn || !farmer?.id) {
        setCloudParityHints([]);
        return;
      }
      const summary = await measureCloudParitySummary({
        profileFarmerId: farmer.id,
        localPlots: plotSnapshot ?? plots,
        localFarmer: farmer,
      }).catch(() => null);
      setCloudParityHints(summary ? formatCloudParityHints(summary, t) : []);
    },
    [farmer, isSignedIn, plots, t],
  );

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await refreshSavedSyncEmail();
        await refreshSyncMetrics();
        await refreshCloudParity();
        await refreshPushPermission();
        const storedAttemptScope = await getSetting('syncQueueAttemptScope').catch(() => null);
        if (
          storedAttemptScope === 'all' ||
          storedAttemptScope === 'retrying_only' ||
          storedAttemptScope === 'first_attempt_only'
        ) {
          setQueueAttemptScope(storedAttemptScope);
        }
        const storedSmartSweepEnabled = await getSetting('syncQueueSmartSweepEnabled').catch(() => null);
        setQueueSmartSweepEnabled(storedSmartSweepEnabled === '1');
        const storedSmartSweepCap = await getSetting('syncQueueSmartSweepCap').catch(() => null);
        if (
          storedSmartSweepCap === '25' ||
          storedSmartSweepCap === '50' ||
          storedSmartSweepCap === '100' ||
          storedSmartSweepCap === '200'
        ) {
          setQueueSmartSweepCap(Number(storedSmartSweepCap) as 25 | 50 | 100 | 200);
        }
      })();
    }, [refreshSavedSyncEmail, refreshSyncMetrics, refreshCloudParity, refreshPushPermission]),
  );

  useEffect(() => {
    let parityTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeServerPlotSyncChanged(() => {
      if (freezeSyncMetricsDisplayRef.current) return;
      void refreshSyncMetrics();
      if (parityTimer) clearTimeout(parityTimer);
      parityTimer = setTimeout(() => {
        parityTimer = null;
        void refreshCloudParity();
      }, 500);
    });
    return () => {
      if (parityTimer) clearTimeout(parityTimer);
      unsubscribe();
    };
  }, [refreshSyncMetrics, refreshCloudParity]);

  useEffect(() => {
    return subscribeSyncQueueLock(() => {
      const next = getSyncQueueLockSnapshot();
      setSyncLockSnapshot(next);
      if (!next.locked && !freezeSyncMetricsDisplayRef.current) {
        void refreshSyncMetrics();
      }
    });
  }, [refreshSyncMetrics]);

  useEffect(() => {
    return subscribeSyncOperationOutcome((outcome) => {
      if (outcome.kind !== 'timeout' || outcome.source !== 'background') return;
      setSyncMessage(syncTimedOutMessage(t, 'settings'));
    });
  }, [t]);

  const isSyncInProgress = syncNowBusy || syncLockSnapshot.locked;

  useEffect(() => {
    setNameInput(farmerDisplayName ?? '');
  }, [farmer?.id, farmerDisplayName]);

  const unsyncedPlotCount = useMemo(() => {
    if (measuredSyncPending != null) return measuredSyncPending.unsyncedPlotCount;
    if (!isSignedIn || plots.length === 0) return 0;
    return listUnsyncedLocalPlots(plots, backendPlots, plotServerLinks).length;
  }, [measuredSyncPending, plots, backendPlots, plotServerLinks, isSignedIn]);

  const totalSyncPending =
    measuredSyncPending?.total ?? queuePendingCount + unsyncedPlotCount;

  const syncApiBaseUrl = getTracebudApiBaseUrl();
  const syncUsesLocalApi = useMemo(() => isLocalLanSyncApi(syncApiBaseUrl), [syncApiBaseUrl]);
  const cloudParityNeedsRestore = cloudParityHints.length > 0 && isSignedIn;
  const showBackupTechDetails =
    __DEV__ ||
    syncUsesLocalApi ||
    plotsFetchState === 'failed' ||
    syncAccessFailure != null ||
    Boolean(queueLastError);

  const backupStatusDisplay = useMemo(
    () =>
      resolveBackupStatusDisplay(
        {
          isSignedIn,
          isSyncInProgress,
          plotsFetchState,
          syncAccessFailure,
          totalSyncPending,
          plotsCount: plots.length,
          hasSettledMetrics: measuredSyncPending != null,
          syncApiBaseUrl,
          cloudParityNeedsRestore: cloudParityNeedsRestore,
        },
        t,
      ),
    [
      isSignedIn,
      isSyncInProgress,
      measuredSyncPending,
      plots.length,
      plotsFetchState,
      syncAccessFailure,
      syncApiBaseUrl,
      totalSyncPending,
      cloudParityNeedsRestore,
      t,
    ],
  );
  const selectedQueueActionTypes = useMemo(
    () =>
      (Object.entries(queueActionFilter)
        .filter(([, enabled]) => enabled)
        .map(([actionType]) => actionType) as PendingSyncAction['actionType'][]),
    [queueActionFilter],
  );
  const queueFilterSummaryLabel = useMemo(() => {
    const labelForAction = (actionType: PendingSyncAction['actionType']) => {
      if (actionType === 'harvest') return t('sync_queue_filter_harvest');
      if (actionType === 'photos_sync') return t('sync_queue_filter_photos');
      if (actionType === 'evidence_sync') return t('sync_queue_filter_evidence');
      if (actionType === 'audit_sync') return t('sync_queue_filter_declarations');
      if (actionType === 'consent_approve') return t('sync_queue_filter_consent');
      if (actionType === 'consent_deny') return t('sync_queue_filter_consent');
      if (actionType === 'consent_revoke') return t('sync_queue_filter_consent');
      return t('sync_queue_filter_evidence');
    };
    const labels = [...new Set(selectedQueueActionTypes.map(labelForAction))];
    if (labels.length === 0) return t('sync_queue_filter_none');
    return t('sync_queue_filter_summary', { labels: labels.join(', ') });
  }, [selectedQueueActionTypes, t]);
  const queueAttemptScopeSummaryLabel = useMemo(() => {
    if (queueSmartSweepEnabled)
      return t('sync_queue_attempt_scope_smart', { cap: queueSmartSweepCap });
    if (queueAttemptScope === 'retrying_only') return t('sync_queue_attempt_scope_retrying');
    if (queueAttemptScope === 'first_attempt_only') return t('sync_queue_attempt_scope_first');
    return t('sync_queue_attempt_scope_all');
  }, [queueAttemptScope, queueSmartSweepEnabled, queueSmartSweepCap, t]);

  const queuePendingBreakdown = useMemo(() => {
    const parts: string[] = [];
    if (queueCountByActionType.harvest > 0) {
      parts.push(`${t('sync_queue_filter_harvest')}: ${queueCountByActionType.harvest}`);
    }
    if (queueCountByActionType.photos_sync > 0) {
      parts.push(`${t('sync_queue_filter_photos')}: ${queueCountByActionType.photos_sync}`);
    }
    if (queueCountByActionType.evidence_sync > 0) {
      parts.push(`${t('sync_queue_filter_evidence')}: ${queueCountByActionType.evidence_sync}`);
    }
    if (queueCountByActionType.audit_sync > 0) {
      parts.push(`${t('sync_queue_filter_declarations')}: ${queueCountByActionType.audit_sync}`);
    }
    const consentPending =
      queueCountByActionType.consent_approve +
      queueCountByActionType.consent_deny +
      queueCountByActionType.consent_revoke;
    if (consentPending > 0) {
      parts.push(`${t('sync_queue_filter_consent')}: ${consentPending}`);
    }
    return parts.join(' · ');
  }, [queueCountByActionType, t]);

  const queueSyncFailure = useMemo(() => {
    const err = queueLastError?.trim();
    if (!err) return null;
    return classifyQueueSyncFailure({
      error: err,
      actionType: queueLastErrorActionType ?? undefined,
    });
  }, [queueLastError, queueLastErrorActionType]);

  const showUploadAttention = useMemo(
    () => shouldShowBackupAttentionPanel({
      isSignedIn,
      queueLastError,
      queueLastErrorActionType,
      queuePendingCount,
      queueRetryingCount,
      queueMaxAttempts,
      queueNextRetrySeconds,
      unsyncedPlotCount,
      plotsFetchFailed: plotsFetchState === 'failed',
      syncAccessFailure,
      queuePendingBreakdown: queuePendingBreakdown || null,
    }),
    [
      isSignedIn,
      plotsFetchState,
      syncAccessFailure,
      queueLastError,
      queueLastErrorActionType,
      queueMaxAttempts,
      queueNextRetrySeconds,
      queuePendingBreakdown,
      queuePendingCount,
      queueRetryingCount,
      unsyncedPlotCount,
    ],
  );

  const pendingDetailMessage = useMemo(() => {
    if (totalSyncPending <= 0) return null;
    const plotCount = measuredSyncPending?.unsyncedPlotCount ?? unsyncedPlotCount;
    const blockedPlotCount = measuredSyncPending?.blockedPlotCount ?? 0;
    const queueCount = measuredSyncPending?.queuePendingCount ?? queuePendingCount;
    const names = measuredSyncPending?.unsyncedPlotNames ?? [];
    const blockedPlots = measuredSyncPending?.blockedPlots ?? [];
    return resolveSyncAttentionMessage({
      pending: {
        total: totalSyncPending,
        unsyncedPlotCount: plotCount,
        blockedPlotCount,
        queuePendingCount: queueCount,
        unsyncedPlotNames: names,
        blockedPlots,
      },
      t,
      queueLastError,
      queueLastErrorActionType,
      plotsFetchFailed: plotsFetchState === 'failed' || measuredSyncPending?.plotsFetchFailed === true,
      syncAccessFailure,
    }).message;
  }, [
    measuredSyncPending,
    plotsFetchState,
    queueLastError,
    queueLastErrorActionType,
    queuePendingCount,
    syncAccessFailure,
    t,
    totalSyncPending,
    unsyncedPlotCount,
  ]);

  const backupAttentionPrimarySummary = pendingDetailMessage;

  const showBackupResultMessage = Boolean(syncMessage && !isSyncInProgress);
  const showBackupSuccessStyle =
    syncMessageKind === 'success' && !cloudParityNeedsRestore;

  const syncGeometryWhyBlock = useMemo(
    () => primaryGeometryBlockForWhy(measuredSyncPending?.blockedPlots),
    [measuredSyncPending?.blockedPlots],
  );

  const showSyncGeometryWhy = syncGeometryWhyBlock != null && syncMessageKind === 'error';

  const showUploadAttentionPanel =
    showUploadAttention && !showBackupResultMessage;

  const resetQueueRetryPreferences = () => {
    setQueueAttemptScope('all');
    setQueueSmartSweepEnabled(false);
    setQueueSmartSweepCap(100);
    setSyncMessage(t('sync_queue_preferences_reset'));
    void setSetting('syncQueueAttemptScope', 'all');
    void setSetting('syncQueueSmartSweepEnabled', '0');
    void setSetting('syncQueueSmartSweepCap', '100');
  };

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setStorageMeasuring(true);
      void measureTracebudStorageFootprint()
        .then((footprint) => {
          if (!cancelled) setStorageFootprint(footprint);
        })
        .finally(() => {
          if (!cancelled) setStorageMeasuring(false);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (params.focus !== 'backup') return;
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, syncSectionY.current - 8),
          animated: true,
        });
      }, 120);
      return () => clearTimeout(timer);
    }, [params.focus]),
  );

  const usedMb = storageFootprint ? footprintBytesToMb(storageFootprint.totalBytes) : 0;
  const storageBreakdown = useMemo(() => {
    if (!storageFootprint || storageFootprint.totalBytes <= 0) return null;
    const photosMb = footprintBytesToMb(storageFootprint.mediaBytes);
    const mapsMb = footprintBytesToMb(storageFootprint.offlineTilesBytes);
    const dataMb = footprintBytesToMb(storageFootprint.sqliteBytes);
    if (photosMb + mapsMb + dataMb <= 0) return null;
    return { photos: photosMb, maps: mapsMb, data: dataMb };
  }, [storageFootprint]);

  const persistPickedImage = async (uri: string) => {
    let out = uri;
    if (Platform.OS !== 'web') {
      try {
        const dest = `${fsAny.documentDirectory ?? ''}farmer-profile.jpg`;
        await FileSystem.copyAsync({ from: uri, to: dest });
        out = dest;
      } catch {
        // keep picker URI if copy fails
      }
    }
    updateFarmerProfilePhoto(out);
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to set your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    await persistPickedImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('perm_camera_title'), t('perm_camera_body'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    await persistPickedImage(result.assets[0].uri);
  };

  const saveFarmerName = () => {
    if (!farmer) {
      Alert.alert(t('profile_title'), t('finish_home_first'));
      return;
    }
    const trimmed = nameInput.trim();
    setFarmer({ ...farmer, name: trimmed || undefined });
  };

  const captureDeclarationGeo = async () => {
    if (!farmer) {
      Alert.alert(t('profile_title'), t('finish_home_first'));
      return;
    }
    try {
      const granted = await requestForegroundLocationOrAlert(t);
      if (!granted) {
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const declarationLatitude = roundWgs84Coordinate(pos.coords.latitude);
      const declarationLongitude = roundWgs84Coordinate(pos.coords.longitude);
      setFarmer({
        ...farmer,
        declarationLatitude,
        declarationLongitude,
        declarationGeoCapturedAt: Date.now(),
      });
    } catch (e) {
      Alert.alert(t('warning'), e instanceof Error ? e.message : t('simplified_declaration_location_failed'));
    }
  };

  const clearDeclarationGeo = () => {
    if (!farmer) return;
    setFarmer({
      ...farmer,
      declarationLatitude: undefined,
      declarationLongitude: undefined,
      declarationGeoCapturedAt: undefined,
    });
  };

  const notificationsEnabled = pushOptIn && pushPermission === 'granted';

  const enablePushNotifications = async () => {
    if (Platform.OS === 'web') {
      setPushMessage(t('settings_notifications_unavailable'));
      return;
    }
    if (!isSignedIn) {
      setPushMessage(t('settings_notifications_sign_in_hint'));
      return;
    }
    setPushRegisterBusy(true);
    setPushMessage(null);
    try {
      await setSetting(PUSH_NOTIFICATIONS_OPT_IN_KEY, '1');
      setPushOptIn(true);
      const result = await registerFarmerPushToken({
        alertOnDeny: true,
        onPermissionDenied: () => alertPushPermissionDenied(t),
      });
      await refreshPushPermission();
      if (result.ok) {
        setPushMessage(t('settings_notifications_enabled'));
        return;
      }
      if (result.reason === 'opted_out') {
        setPushMessage(t('settings_notifications_disabled'));
        return;
      }
      if (result.reason === 'denied') {
        await setSetting(PUSH_NOTIFICATIONS_OPT_IN_KEY, '0');
        setPushOptIn(false);
        setPushMessage(t('settings_notifications_denied'));
        return;
      }
      if (result.reason === 'unavailable') {
        setPushMessage(t('settings_notifications_unavailable'));
        return;
      }
      setPushMessage(t('settings_notifications_failed'));
    } finally {
      setPushRegisterBusy(false);
    }
  };

  const disablePushNotifications = async () => {
    setPushRegisterBusy(true);
    setPushMessage(null);
    try {
      await setSetting(PUSH_NOTIFICATIONS_OPT_IN_KEY, '0');
      setPushOptIn(false);
      await unregisterFarmerPushToken();
      setPushMessage(t('settings_notifications_disabled'));
    } catch {
      setPushMessage(t('settings_notifications_disable_failed'));
    } finally {
      setPushRegisterBusy(false);
    }
  };

  const onNotificationsToggle = (enabled: boolean) => {
    if (pushRegisterBusy) return;
    if (enabled) {
      void enablePushNotifications();
      return;
    }
    void disablePushNotifications();
  };

  const displayProfileEmail = isSignedIn
    ? syncEmail.trim() || getAuthCredentials().email || '—'
    : t('profile_email_none');

  const enterProfileEdit = () => {
    setNameInput(farmerDisplayName ?? '');
    setProfileEditing(true);
  };

  const exitProfileEditSave = () => {
    if (!farmer) {
      Alert.alert(t('profile_title'), t('finish_home_first'));
      return;
    }
    saveFarmerName();
    setProfileEditing(false);
  };

  const exitProfileEditCancel = () => {
    setNameInput(farmerDisplayName ?? '');
    void refreshSavedSyncEmail();
    setProfileEditing(false);
  };

  const openPhotoOptions = () => {
    if (!farmer) {
      Alert.alert(t('profile_title'), t('finish_home_photo'));
      return;
    }
    Alert.alert(t('profile_photo_title'), t('profile_photo_body'), [
      { text: t('photo_library'), onPress: () => void pickFromLibrary() },
      { text: t('take_photo'), onPress: () => void takePhoto() },
      ...(farmer?.profilePhotoUri
        ? [{ text: t('remove_photo'), style: 'destructive' as const, onPress: () => updateFarmerProfilePhoto(null) }]
        : []),
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  const onSignOutSync = () => {
    Alert.alert(t('sign_out_device'), t('sign_out_device_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('sign_out_device'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await signOutOnDevice();
              setSyncEmail('');
              setSyncMessage(null);
              void refreshSyncMetrics();
              Alert.alert(t('sign_out_device'), t('signed_out_device'));
            } catch (e) {
              const message = e instanceof Error ? e.message : String(e);
              Alert.alert(t('sign_out_device'), message);
            }
          })();
        },
      },
    ]);
  };

  const runSyncNow = async () => {
    setSyncNowBusy(true);
    freezeSyncMetricsDisplayRef.current = true;
    setSyncMessage(null);
    setSyncMessageKind(null);
    setSyncSupportMailto(null);
    setSyncOpenPlotId(null);
    try {
      await withSyncQueueLock(
        async () => {
          await withSyncOperationTimeout(
            (async () => {
          let sessionOpened: Awaited<ReturnType<typeof openFieldSyncSession>> | null = null;
          try {
            await hydrateSyncAuthFromSettings();
            sessionOpened = await openFieldSyncSession();
            if (!sessionOpened.ok) {
              reportSyncFailure(sessionOpened.failure, { source: 'settings_sync_now' });
              setSyncMessage(formatSyncFailureUserMessage(sessionOpened.failure, t));
              setSyncMessageKind('error');
              return;
            }
            const syncAccess = { ok: true as const, token: sessionOpened.session.accessToken };

            if (!farmer?.id) {
              setSyncMessage(t('sync_no_farmer_profile'));
              setSyncMessageKind('error');
              return;
            }

            await reloadFromDisk();
            let diskState = await loadAppState();
            let syncFarmer = diskState.farmer ?? farmer;
            let syncPlots = diskState.plots.length > 0 ? diskState.plots : plots;
            if (!syncFarmer?.id) {
              setSyncMessage(t('sync_no_farmer_profile'));
              setSyncMessageKind('error');
              return;
            }
            const syncContext = await prepareFieldSyncContext({
              profileFarmerId: syncFarmer.id,
              localPlots: syncPlots,
            });
            const apiFarmerId = syncContext.farmerId;
            const farmerScopeIds = syncContext.ownedFarmerIds;
            await ensureFieldProducerBootstrapped(apiFarmerId, {
              fullName: syncFarmer?.name?.trim() || undefined,
            });
            if (syncContext.rekeyed) {
              await reloadFromDisk();
              diskState = await loadAppState();
              syncFarmer = diskState.farmer ?? syncFarmer;
              syncPlots = diskState.plots.length > 0 ? diskState.plots : syncPlots;
            } else if (apiFarmerId !== syncFarmer.id) {
              await adoptOnDeviceFarmerScope(apiFarmerId).catch(() => false);
            }

            const pipeline = await runFieldSyncPipeline({
              accessToken: syncAccess.token,
              apiFarmerId,
              farmerScopeIds,
              syncFarmer,
              syncPlots,
              t,
              selectedQueueActionTypes: selectedQueueActionTypes,
              allQueueActionTypes: ALL_QUEUE_ACTION_TYPES,
              syncDrainActionTypes: SYNC_DRAIN_ACTION_TYPES,
              consentActionTypes: CONSENT_QUEUE_ACTION_TYPES,
              isConsentQueueActionType,
              queueSmartSweepEnabled,
              queueSmartSweepCap,
              onPhase: setSyncQueuePhase,
            });

            if (pipeline.stoppedForAuth) {
              setSyncMessage(t('sync_session_expired_short'));
              setSyncMessageKind('error');
              return;
            }

            if (pipeline.permissionDenied) {
              setSyncMessage(t('field_permission_denied'));
              setSyncMessageKind('error');
              return;
            }

            const outcome = pipeline.outcome;

            await reloadFromDisk();
            diskState = await loadAppState().catch(() => ({ plots: syncPlots }));
            const freshPending = await refreshSyncMetrics({
              forcePlotFetch: true,
              farmerId: apiFarmerId,
              ownedFarmerIds: farmerScopeIds,
              plots: diskState.plots.length > 0 ? diskState.plots : syncPlots,
            });
            await refreshCloudParity(
              diskState.plots.length > 0 ? diskState.plots : syncPlots,
            );

            // U9: re-read the latest queue error from fresh rows — the closure
            // `queueLastError` was captured before the sync and is stale.
            const freshQueueRows = await loadPendingSyncActions().catch(() => []);
            const freshLatestErrored = [...freshQueueRows]
              .filter((row) => (row.attempts ?? 0) > 0)
              .sort((a, b) => {
                if ((b.attempts ?? 0) !== (a.attempts ?? 0)) {
                  return (b.attempts ?? 0) - (a.attempts ?? 0);
                }
                return (b.createdAt ?? 0) - (a.createdAt ?? 0);
              })[0];
            const freshQueueLastError = freshLatestErrored?.lastError?.trim() || null;
            const freshQueueLastErrorActionType = freshLatestErrored?.actionType ?? null;

            const attention = resolveSyncAttentionMessage({
              pending: {
                total: freshPending?.total ?? outcome.remainingPending ?? 0,
                unsyncedPlotCount: freshPending?.unsyncedPlotCount ?? outcome.unsyncedPlotCount ?? 0,
                blockedPlotCount: freshPending?.blockedPlotCount ?? outcome.blockedPlotCount ?? 0,
                queuePendingCount: freshPending?.queuePendingCount ?? outcome.queuePendingCount ?? 0,
                unsyncedPlotNames: freshPending?.unsyncedPlotNames ?? outcome.unsyncedPlotNames ?? [],
                blockedPlots: freshPending?.blockedPlots ?? outcome.blockedPlots ?? [],
              },
              t,
              syncOutcome: outcome,
              queueLastError: freshQueueLastError,
              queueLastErrorActionType: freshQueueLastErrorActionType,
              plotsFetchFailed:
                freshPending?.plotsFetchFailed === true || outcome.plotsFetchFailed === true,
              syncAccessFailure,
              plotsUploadNotAttempted:
                (pipeline.lastPlotUploadResult?.unsyncedBefore ?? 0) === 0 &&
                (freshPending?.unsyncedPlotCount ?? 0) > 0,
            });

            let finalSyncMessage = attention.message;
            if (attention.kind === 'success') {
              const plotsForLandCheck =
                diskState.plots.length > 0 ? diskState.plots : syncPlots;
              const cachedBackend =
                peekServerPlotListCache({
                  farmerId: apiFarmerId,
                  ownedFarmerIds: farmerScopeIds,
                }) ?? [];
              const names = await listSyncedPlotNamesWithLocalLandDocsOnly({
                plots: plotsForLandCheck,
                backendPlots: cachedBackend,
              }).catch(() => []);
              finalSyncMessage = appendLandDocsReminderToSyncCompleteMessage(
                attention.message,
                names,
                t,
              );
            }
            setSyncMessage(finalSyncMessage);
            setSyncSupportMailto(resolveSyncSupportMailto(outcome) ?? null);
            setSyncOpenPlotId(resolveSyncOpenPlotId(outcome) ?? null);
            setSyncMessageKind(attention.kind);
          } catch (e) {
            if (e instanceof SyncOperationTimeoutError) {
              emitSyncOperationOutcome({ kind: 'timeout', source: 'manual', at: Date.now() });
              setSyncMessage(syncTimedOutMessage(t, 'settings'));
              setSyncMessageKind('error');
              return;
            }
            const message = e instanceof Error ? e.message : String(e);
            setSyncMessage(
              isNetworkReachabilityFailure(message)
                ? resolveSyncReachFailedShortMessage(t, syncApiBaseUrl)
                : t('sync_result_incomplete', { n: totalSyncPending }),
            );
            setSyncMessageKind('error');
          } finally {
            if (sessionOpened?.ok) {
              sessionOpened.end();
            }
          }
            })(),
            SYNC_MANUAL_OPERATION_MS,
          );
      },
        { waitMs: SYNC_LOCK_WAIT_MS },
      );
    } catch (e) {
      if (e instanceof SyncQueueLockTimeoutError) {
        setSyncMessage(t('sync_busy_try_later_settings'));
        setSyncMessageKind('error');
        return;
      }
      if (e instanceof SyncOperationTimeoutError) {
        emitSyncOperationOutcome({ kind: 'timeout', source: 'manual', at: Date.now() });
        setSyncMessage(syncTimedOutMessage(t, 'settings'));
        setSyncMessageKind('error');
        return;
      }
      const message = e instanceof Error ? e.message : String(e);
      setSyncMessage(
        isNetworkReachabilityFailure(message)
          ? resolveSyncReachFailedShortMessage(t, syncApiBaseUrl)
          : t('sync_result_incomplete', { n: totalSyncPending }),
      );
      setSyncMessageKind('error');
    } finally {
      freezeSyncMetricsDisplayRef.current = false;
      setSyncNowBusy(false);
      await refreshSyncMetrics({ forcePlotFetch: true });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <CompactTabHeader
        paddingTop={insets.top}
        left={<TabHeaderSpacer />}
        centerTitle={t('settings_title')}
        onLanguagePress={openLanguagePicker}
        languageLabel={languageCode}
      />

      <ThemedScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Card variant="outlined" padding="none" style={styles.card}>
          <CardContent style={styles.cardInner}>
            {!profileEditing ? (
              <>
                <View style={styles.profileReadonlyTop}>
                  <View style={styles.userAvatar}>
                    {farmer?.profilePhotoUri ? (
                      <Image source={{ uri: farmer.profilePhotoUri }} style={styles.avatarImage} />
                    ) : (
                      <Ionicons name="person-outline" size={28} color={Brand.primary} />
                    )}
                  </View>
                  <View style={styles.profileReadonlyTextCol}>
                    <ThemedText type="subtitle" style={styles.profileReadonlyName}>
                      {farmerDisplayName ?? t('profile_no_name')}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.mutedText}>
                      {displayProfileEmail}
                    </ThemedText>
                  </View>
                </View>

                {isSignedIn ? (
                  <View style={styles.profileAccountSection}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={onSignOutSync}
                      hitSlop={8}
                      style={styles.profileSignOutRow}
                    >
                      <ThemedText type="caption" style={styles.profileSignOutLink}>
                        {t('sign_out_device')}
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : null}

                <Button variant="secondary" size="md" fullWidth onPress={enterProfileEdit}>
                  {t('profile_edit')}
                </Button>
              </>
            ) : (
              <>
                <View style={styles.profileAvatarRow}>
                  <Pressable
                    onPress={openPhotoOptions}
                    accessibilityRole="button"
                    accessibilityLabel="Change profile photo"
                    style={styles.avatarWrap}
                  >
                    <View style={styles.userAvatar}>
                      {farmer?.profilePhotoUri ? (
                        <Image source={{ uri: farmer.profilePhotoUri }} style={styles.avatarImage} />
                      ) : (
                        <Ionicons name="person-outline" size={28} color={Brand.primary} />
                      )}
                    </View>
                    <View style={styles.avatarCameraBadge} pointerEvents="none">
                      <Ionicons name="camera" size={13} color="#FFFFFF" />
                    </View>
                  </Pressable>
                  <Pressable onPress={openPhotoOptions} hitSlop={12} style={styles.changeLink}>
                    <ThemedText type="defaultSemiBold" style={styles.changeLinkText}>
                      {t('change_photo')}
                    </ThemedText>
                  </Pressable>
                </View>
                <Input
                  label={t('label_your_name')}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder={farmer ? t('ph_your_name') : t('ph_complete_home')}
                  editable={Boolean(farmer)}
                  containerStyle={styles.nameInputWrap}
                />

                {isSignedIn ? (
                  <SetPasswordCard
                    signedIn={isSignedIn}
                    t={t}
                    onPasswordSaved={() => {
                      void refreshSavedSyncEmail();
                    }}
                  />
                ) : null}

                <View style={styles.profileEditActions}>
                  <Button variant="primary" size="md" fullWidth onPress={exitProfileEditSave} disabled={!farmer}>
                    {t('profile_save')}
                  </Button>
                  <Button variant="outline" size="md" fullWidth onPress={exitProfileEditCancel}>
                    {t('cancel')}
                  </Button>
                </View>
              </>
            )}
          </CardContent>
        </Card>

        {!profileEditing ? (
          <>
            <Card
              variant="outlined"
              padding="none"
              style={styles.card}
              testID="settings-cloud-parity-section"
              onLayout={(e) => {
                syncSectionY.current = e.nativeEvent.layout.y;
              }}
            >
              <CardContent style={styles.cardInner}>
                <View style={styles.backupCardHeader}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="cloud-upload-outline" size={20} color={Brand.primary} />
                    <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                      {t('sync_status_section')}
                    </ThemedText>
                  </View>
                  <ThemedText
                    type="caption"
                    style={[
                      styles.backupStatusText,
                      backupStatusDisplay.needsAttention ? styles.backupStatusPending : styles.backupStatusOk,
                    ]}
                  >
                    {backupStatusDisplay.label}
                  </ThemedText>
                </View>
                <ThemedText type="caption" style={styles.backupIntroText}>
                  {t('settings_backup_sync_body')}
                </ThemedText>
                {cloudParityHints.length > 0 && isSignedIn
                  ? cloudParityHints.map((hint, index) => (
                      <ThemedText
                        key={hint}
                        testID={`settings-cloud-parity-hint-${index}`}
                        type="caption"
                        style={styles.uploadIssueSummary}
                      >
                        {hint}
                      </ThemedText>
                    ))
                  : null}
                {syncUsesLocalApi ? (
                  <ThemedText type="caption" style={styles.uploadIssueSummary}>
                    {resolveSyncConnectivityUserMessage(t, syncApiBaseUrl)}
                  </ThemedText>
                ) : null}

                <View style={styles.btnWrap}>
                  {isSignedIn ? (
                    <Button
                      variant={totalSyncPending > 0 ? 'primary' : 'secondary'}
                      size="md"
                      fullWidth
                      loading={isSyncInProgress}
                      disabled={isSyncInProgress}
                      testID="settings-sync-now"
                      onPress={() => void runSyncNow()}
                    >
                      {isSyncInProgress ? t('sync_now_syncing') : t('sync_now')}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      onPress={() =>
                        openSignIn({
                          variant: 'sync',
                          onSuccess: async () => {
                            await refreshSavedSyncEmail();
                            await refreshSyncMetrics();
                            setSyncMessage(null);
                          },
                        })
                      }
                    >
                      {t('sign_in_to_backup_title')}
                    </Button>
                  )}
                </View>

                {showBackupResultMessage ? (
                  <View style={styles.syncResultBlock}>
                    <ThemedText
                      type="caption"
                      style={[
                        styles.syncHint,
                        showBackupSuccessStyle ? styles.syncHintSuccess : null,
                        syncMessageKind === 'error' ? styles.syncHintError : null,
                      ]}
                    >
                      {syncMessage}
                    </ThemedText>
                    {showSyncGeometryWhy && syncGeometryWhyBlock ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          const explain = resolveGeometrySyncWhyExplain(syncGeometryWhyBlock, t);
                          if (!explain) return;
                          Alert.alert(explain.title, explain.body);
                        }}
                        style={styles.syncWhyLink}
                      >
                        <ThemedText type="caption" style={styles.syncWhyLinkText}>
                          {t('sync_why_button')}
                        </ThemedText>
                      </Pressable>
                    ) : null}
                    {syncOpenPlotId ? (
                      <View style={styles.btnWrap}>
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          onPress={() => {
                            router.push(`/plot/${encodeURIComponent(syncOpenPlotId)}`);
                          }}
                        >
                          {t('sync_open_plot')}
                        </Button>
                      </View>
                    ) : null}
                    {syncSupportMailto ? (
                      <View style={styles.btnWrap}>
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          onPress={() => {
                            Linking.openURL(syncSupportMailto).catch(() => undefined);
                          }}
                        >
                          {t('sync_contact_support_overlap')}
                        </Button>
                      </View>
                    ) : null}
                  </View>
                ) : null}
                {showUploadAttentionPanel ? (
                  <View style={styles.uploadIssuePanel}>
                    <View style={styles.uploadIssueHeader}>
                      <Ionicons name="warning-outline" size={16} color="#B45309" />
                      <ThemedText type="caption" style={styles.uploadIssueSummary}>
                        {backupAttentionPrimarySummary ?? t('settings_sync_upload_issue_short')}
                      </ThemedText>
                    </View>
                  </View>
                ) : null}
                {showBackupTechDetails ? (
                  <>
                    <Pressable
                      onPress={() => setBackupTechOpen((open) => !open)}
                      style={styles.backupTechToggle}
                      accessibilityRole="button"
                    >
                      <ThemedText type="caption" style={styles.backupTechToggleText}>
                        {backupTechOpen
                          ? t('settings_backup_tech_hide')
                          : t('settings_backup_tech_show')}
                      </ThemedText>
                      <Ionicons
                        name={backupTechOpen ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color="#9CA3AF"
                      />
                    </Pressable>
                    {backupTechOpen ? (
                      <View style={styles.backupTechBody}>
                        {__DEV__ ? (
                          <ThemedText type="caption" style={styles.backupTechDetailText}>
                            {t('settings_dev_runtime_metro')}
                          </ThemedText>
                        ) : null}
                        <ThemedText type="caption" style={styles.backupTechDetailText}>
                          {t('settings_api_base')}: {syncApiBaseUrl}
                        </ThemedText>
                        {syncUsesLocalApi ? (
                          <ThemedText type="caption" style={styles.backupTechDetailText}>
                            {t('sync_local_api_warning', { api: syncApiBaseUrl })}
                          </ThemedText>
                        ) : null}
                        {queuePendingBreakdown ? (
                          <ThemedText type="caption" style={styles.backupTechDetailText}>
                            {queuePendingBreakdown}
                          </ThemedText>
                        ) : null}
                        {queueSyncFailure ? (
                          <ThemedText type="caption" style={styles.backupTechDetailText}>
                            {t('settings_sync_failure_step')}: {formatSyncFailureStepLabel(queueSyncFailure, t)}
                          </ThemedText>
                        ) : null}
                        {queueLastError ? (
                          <ThemedText type="caption" style={styles.backupTechDetailText}>
                            {t('settings_sync_last_error', {
                              action: queueLastErrorActionType ?? 'sync',
                            })}
                            : {queueLastError}
                          </ThemedText>
                        ) : null}
                      </View>
                    ) : null}
                  </>
                ) : null}
              </CardContent>
            </Card>

            {Platform.OS !== 'web' ? (
              <Card variant="outlined" padding="none" style={styles.card}>
                <CardContent style={styles.cardInner}>
                  <View style={styles.notificationsCardHeader}>
                    <View style={styles.sectionHeaderRow}>
                      <Ionicons name="notifications-outline" size={20} color={Brand.primary} />
                      <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                        {t('settings_notifications_title')}
                      </ThemedText>
                    </View>
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={onNotificationsToggle}
                      disabled={pushRegisterBusy || !isSignedIn}
                      trackColor={{ false: '#D1D5DB', true: Brand.primary }}
                      thumbColor="#FFFFFF"
                      accessibilityLabel={t('settings_notifications_title')}
                    />
                  </View>
                  <ThemedText
                    type="caption"
                    style={[
                      styles.backupStatusText,
                      notificationsEnabled ? styles.backupStatusOk : styles.backupStatusPending,
                    ]}
                  >
                    {notificationsEnabled
                      ? t('settings_notifications_status_on')
                      : pushPermission === 'denied'
                        ? t('settings_notifications_status_off')
                        : !pushOptIn
                          ? t('settings_notifications_status_off')
                          : t('settings_notifications_status_unknown')}
                  </ThemedText>
                  <ThemedText type="caption" style={styles.mutedText}>
                    {t('settings_notifications_body')}
                  </ThemedText>
                  {!isSignedIn ? (
                    <ThemedText type="caption" style={styles.mutedText}>
                      {t('settings_notifications_sign_in_hint')}
                    </ThemedText>
                  ) : null}
                  {pushPermission === 'denied' && pushOptIn ? (
                    <View style={styles.btnWrap}>
                      <Button
                        variant="outline"
                        size="md"
                        fullWidth
                        onPress={() => Linking.openSettings()}
                      >
                        {t('open_settings')}
                      </Button>
                    </View>
                  ) : null}
                  {pushMessage ? (
                    <ThemedText type="caption" style={styles.syncHint}>
                      {pushMessage}
                    </ThemedText>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Card variant="outlined" padding="none" style={styles.card}>
              <CardContent style={styles.cardInner}>
                <Pressable
                  onPress={() => router.push('/data-sharing')}
                  style={styles.dataSharingRow}
                  accessibilityRole="button"
                >
                  <View style={styles.dataSharingRowMain}>
                    <View style={styles.sectionHeaderRow}>
                      <Ionicons name="shield-checkmark-outline" size={20} color={Brand.primary} />
                      <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                        {t('data_sharing_title')}
                      </ThemedText>
                    </View>
                    <ThemedText type="caption" style={styles.mutedText}>
                      {t('data_sharing_settings_body')}
                    </ThemedText>
                  </View>
                  <View style={styles.dataSharingRowAction}>
                    <ThemedText type="defaultSemiBold" style={styles.greenText}>
                      {t('data_sharing_manage')}
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={18} color="#0A7F59" />
                  </View>
                </Pressable>
              </CardContent>
            </Card>

            <Card variant="outlined" padding="none" style={styles.card}>
              <CardContent style={styles.cardInner}>
                <Pressable
                  onPress={() => setAdvancedOpen((open) => !open)}
                  style={styles.advancedToggle}
                  accessibilityRole="button"
                >
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="options-outline" size={20} color={Brand.primary} />
                    <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                      {t('settings_advanced')}
                    </ThemedText>
                  </View>
                  <Ionicons
                    name={advancedOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Brand.primary}
                  />
                </Pressable>
                {!advancedOpen ? (
                  <ThemedText type="caption" style={styles.mutedText}>
                    {t('settings_advanced_body')}
                  </ThemedText>
                ) : null}
                {advancedOpen ? (
                  <View style={styles.advancedBody}>
                    {farmer ? (
                      <View style={styles.advancedSection}>
                        <ThemedText type="defaultSemiBold" style={styles.advancedSectionTitle}>
                          {t('settings_declaration_geo_label')}
                        </ThemedText>
                        <ThemedText type="caption" style={styles.mutedText}>
                          {t('simplified_declaration_geo_body')}
                        </ThemedText>
                        {farmer.declarationLatitude != null &&
                        farmer.declarationLongitude != null &&
                        Number.isFinite(farmer.declarationLatitude) &&
                        Number.isFinite(farmer.declarationLongitude) ? (
                          <ThemedText type="caption">
                            {Math.abs(farmer.declarationLatitude).toFixed(6)}°
                            {farmer.declarationLatitude >= 0 ? 'N' : 'S'},{' '}
                            {Math.abs(farmer.declarationLongitude).toFixed(6)}°
                            {farmer.declarationLongitude >= 0 ? 'E' : 'W'}
                          </ThemedText>
                        ) : null}
                        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                          <Button variant="secondary" size="md" onPress={() => void captureDeclarationGeo()}>
                            {t('simplified_declaration_capture_gps')}
                          </Button>
                          {farmer.declarationLatitude != null && farmer.declarationLongitude != null ? (
                            <Button variant="outline" size="md" onPress={clearDeclarationGeo}>
                              {t('simplified_declaration_clear_gps')}
                            </Button>
                          ) : null}
                        </View>
                      </View>
                    ) : null}

                    <View style={styles.advancedSection}>
                      <ThemedText type="defaultSemiBold" style={styles.advancedSectionTitle}>
                        {t('local_storage')}
                      </ThemedText>
                      <View style={styles.storageBarTrack}>
                        {storageFootprint && storageFootprint.totalBytes > 0 ? (
                          <>
                            {storageFootprint.mediaBytes > 0 ? (
                              <View style={[styles.storageBarSegment, { flex: storageFootprint.mediaBytes }]} />
                            ) : null}
                            {storageFootprint.offlineTilesBytes > 0 ? (
                              <View
                                style={[
                                  styles.storageBarSegment,
                                  styles.storageBarSegmentMaps,
                                  { flex: storageFootprint.offlineTilesBytes },
                                ]}
                              />
                            ) : null}
                            {storageFootprint.sqliteBytes > 0 ? (
                              <View
                                style={[
                                  styles.storageBarSegment,
                                  styles.storageBarSegmentData,
                                  { flex: storageFootprint.sqliteBytes },
                                ]}
                              />
                            ) : null}
                          </>
                        ) : null}
                      </View>
                      {storageMeasuring ? (
                        <ThemedText type="caption" style={styles.mutedText}>
                          {t('storage_footprint_measuring')}
                        </ThemedText>
                      ) : (
                        <>
                          <ThemedText type="caption" style={styles.mutedText}>
                            {t('mb_used', { used: usedMb })}
                          </ThemedText>
                          {storageBreakdown ? (
                            <ThemedText type="caption" style={styles.storageBreakdownText}>
                              {t('storage_footprint_breakdown', storageBreakdown)}
                            </ThemedText>
                          ) : null}
                        </>
                      )}
                    </View>

                    {__DEV__ ? (
                      <View style={styles.advancedSection}>
                        <ThemedText type="defaultSemiBold" style={styles.advancedSectionTitle}>
                          {t('settings_queue_debug_title')}
                        </ThemedText>
                        <ThemedText type="caption">{queueFilterSummaryLabel}</ThemedText>
                        <ThemedText type="caption">{queueAttemptScopeSummaryLabel}</ThemedText>
                        <View style={styles.syncQueueFilterRow}>
                          <Pressable
                            onPress={() =>
                              setQueueSmartSweepEnabled((prev) => {
                                const next = !prev;
                                void setSetting('syncQueueSmartSweepEnabled', next ? '1' : '0');
                                return next;
                              })
                            }
                            style={[
                              styles.syncQueueFilterChip,
                              queueSmartSweepEnabled && styles.syncQueueFilterChipActive,
                            ]}
                            accessibilityRole="button"
                          >
                            <ThemedText
                              type="caption"
                              style={
                                queueSmartSweepEnabled ? styles.syncQueueFilterChipTextActive : undefined
                              }
                            >
                              {t('sync_queue_smart_sweep_label')}
                            </ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={resetQueueRetryPreferences}
                            style={styles.syncQueueFilterChip}
                            accessibilityRole="button"
                          >
                            <ThemedText type="caption">{t('sync_queue_reset_preferences_label')}</ThemedText>
                          </Pressable>
                        </View>
                        {queueSmartSweepEnabled ? (
                          <View style={styles.syncQueueFilterRow}>
                            {([25, 50, 100, 200] as const).map((cap) => {
                              const enabled = queueSmartSweepCap === cap;
                              return (
                                <Pressable
                                  key={cap}
                                  onPress={() => {
                                    setQueueSmartSweepCap(cap);
                                    void setSetting('syncQueueSmartSweepCap', String(cap));
                                  }}
                                  style={[
                                    styles.syncQueueFilterChip,
                                    enabled && styles.syncQueueFilterChipActive,
                                  ]}
                                  accessibilityRole="button"
                                >
                                  <ThemedText
                                    type="caption"
                                    style={enabled ? styles.syncQueueFilterChipTextActive : undefined}
                                  >
                                    Cap {cap}
                                  </ThemedText>
                                </Pressable>
                              );
                            })}
                          </View>
                        ) : null}
                        <View style={styles.syncQueueFilterRow}>
                          {(
                            [
                              ['all', t('sync_queue_attempt_chip_all')],
                              ['retrying_only', t('sync_queue_attempt_chip_retrying')],
                              ['first_attempt_only', t('sync_queue_attempt_chip_first')],
                            ] as const
                          ).map(([scope, label]) => {
                            const enabled = queueAttemptScope === scope;
                            return (
                              <Pressable
                                key={scope}
                                onPress={() => {
                                  setQueueAttemptScope(scope);
                                  setQueueSmartSweepEnabled(false);
                                  void setSetting('syncQueueAttemptScope', scope);
                                  void setSetting('syncQueueSmartSweepEnabled', '0');
                                }}
                                style={[
                                  styles.syncQueueFilterChip,
                                  enabled && styles.syncQueueFilterChipActive,
                                ]}
                                accessibilityRole="button"
                              >
                                <ThemedText
                                  type="caption"
                                  style={enabled ? styles.syncQueueFilterChipTextActive : undefined}
                                >
                                  {label}
                                </ThemedText>
                              </Pressable>
                            );
                          })}
                        </View>
                        <View style={styles.syncQueueFilterRow}>
                          {(
                            [
                              ['harvest', t('sync_queue_filter_harvest')],
                              ['photos_sync', t('sync_queue_filter_photos')],
                              ['evidence_sync', t('sync_queue_filter_evidence')],
                              ['audit_sync', t('sync_queue_filter_declarations')],
                            ] as const
                          ).map(([actionType, label]) => {
                            const enabled = queueActionFilter[actionType];
                            const count = queueCountByActionType[actionType] ?? 0;
                            return (
                              <Pressable
                                key={actionType}
                                onPress={() =>
                                  setQueueActionFilter((prev) => ({
                                    ...prev,
                                    [actionType]: !prev[actionType],
                                  }))
                                }
                                style={[
                                  styles.syncQueueFilterChip,
                                  enabled && styles.syncQueueFilterChipActive,
                                ]}
                                accessibilityRole="button"
                              >
                                <ThemedText
                                  type="caption"
                                  style={enabled ? styles.syncQueueFilterChipTextActive : undefined}
                                >
                                  {label} ({count})
                                </ThemedText>
                              </Pressable>
                            );
                          })}
                        </View>
                        <ThemedText type="caption" style={styles.mutedText}>
                          {t('settings_api_base')}: {getTracebudApiBaseUrl()}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </CardContent>
            </Card>

            <Card variant="outlined" padding="none" style={[styles.card, styles.helpCard]}>
              <CardContent style={styles.cardInner}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="leaf-outline" size={20} color={Brand.primary} />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                      {t('why_tracebud_settings_title')}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.mutedText}>
                      {t('why_tracebud_settings_subtitle')}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.btnWrap}>
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onPress={() => router.push({ pathname: '/why-tracebud', params: { source: 'settings' } })}
                  >
                    {t('why_tracebud_settings_cta')}
                  </Button>
                </View>
              </CardContent>
            </Card>

            <Card variant="outlined" padding="none" style={[styles.card, styles.helpCard]}>
              <CardContent style={styles.cardInner}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="information-circle-outline" size={20} color={Brand.primary} />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                      {t('need_help')}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.mutedText}>
                      {t('help_contact_hint')}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.btnWrap}>
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onPress={() => {
                      Linking.openURL('mailto:support@tracebud.com').catch(() => undefined);
                    }}
                  >
                    {t('contact_us_btn')}
                  </Button>
                </View>
                <Pressable
                  onPress={() => setHelpTipsOpen((open) => !open)}
                  style={styles.helpTipsToggle}
                  accessibilityRole="button"
                >
                  <ThemedText type="defaultSemiBold" style={styles.greenText}>
                    {helpTipsOpen ? t('help_hide_tips') : t('help_show_tips')}
                  </ThemedText>
                  <Ionicons
                    name={helpTipsOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Brand.primary}
                  />
                </Pressable>
                {helpTipsOpen ? (
                  <View style={styles.helpTipsContent}>
                    <ThemedText type="defaultSemiBold" style={styles.helpTipsSectionTitle}>
                      {t('help_plot_mapping_title')}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.helpFarmerTips}>
                      {t('help_plot_mapping_body')}
                    </ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.helpTipsSectionTitle}>
                      {t('help_backup_title')}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.helpFarmerTips}>
                      {t('help_farmer_body')}
                    </ThemedText>
                  </View>
                ) : null}
              </CardContent>
            </Card>
          </>
        ) : null}
      </ThemedScrollView>
    </ThemedView>
  );
}


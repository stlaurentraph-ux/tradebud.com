import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
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
  verifySyncAccessToken,
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
  uploadUnsyncedPlotsForFarmer,
  warmPlotServerLinksForSync,
} from '@/features/sync/plotServerSync';
import { drainPendingSyncQueueForManualSync } from '@/features/sync/drainPendingSyncQueue';
import {
  prepareFieldSyncContext,
} from '@/features/sync/resolveFieldSyncScope';
import { fetchServerPlotListForUi, invalidateServerPlotListCache, peekServerPlotListCache } from '@/features/sync/serverPlotListCache';
import { processPendingSyncQueue } from '@/features/sync/processPendingSyncQueue';
import {
  beginServerPlotFetchRun,
  endServerPlotFetchRun,
} from '@/features/sync/serverPlotFetchCache';
import { processPendingConsentQueue } from '@/features/sync/processPendingConsentQueue';
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
import { subscribeSyncOperationOutcome } from '@/features/sync/syncOperationOutcome';
import { mapSyncActionErrorMessage, mapPlotUploadErrorMessage, syncTimedOutMessage } from '@/features/errors/mapApiErrorToUserMessage';
import { formatSyncNowUserMessage, formatPendingSyncSummary, resolveSyncOpenPlotId, resolveSyncSupportMailto, type SyncNowUserOutcome } from '@/features/sync/formatSyncNowUserMessage';
import {
  primaryGeometryBlockForWhy,
  resolveGeometrySyncWhyExplain,
} from '@/features/compliance/plotGeometrySyncExplain';
import { measureTotalSyncPending, type TotalSyncPendingSnapshot } from '@/features/sync/measureTotalSyncPending';
import {
  appendLandDocsReminderToSyncCompleteMessage,
  listSyncedPlotNamesWithLocalLandDocsOnly,
} from '@/features/sync/landDocUploadReminder';
import { enqueuePlotDependentSyncForLinkedPlots } from '@/features/sync/enqueuePlotDependentSyncActions';
import {
  pickBackupAttentionPrimaryKind,
  shouldShowBackupAttentionPanel,
} from '@/features/sync/backupAttentionSummary';
import { isLocalLanSyncApi } from '@/features/dev/syncApiTarget';
import { isNetworkReachabilityFailure } from '@/features/sync/syncReachabilityMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';

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
  const { farmer, plots, setFarmer, updateFarmerProfilePhoto, reloadFromDisk } = useAppState();
  const { refreshAuth, openSignIn, isSignedIn, signOutOnDevice } = useSignInSheet();
  const [nameInput, setNameInput] = useState('');
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncMessageKind, setSyncMessageKind] = useState<'success' | 'error' | null>(null);
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
  }) => {
    await compactDuplicatePendingSyncActions().catch(() => 0);
    const rows = await loadPendingSyncActions().catch(() => []);
    await hydrateSyncAuthFromSettings().catch(() => undefined);
    const applyDisplay =
      !freezeSyncMetricsDisplayRef.current && !getSyncQueueLockSnapshot().locked;

    if (applyDisplay) {
      setQueuePendingCount(rows.length);
      setQueueCountByActionType(
        rows.reduce<Record<PendingSyncAction['actionType'], number>>(
          (acc, row) => {
            acc[row.actionType] += 1;
            return acc;
          },
          { harvest: 0, photos_sync: 0, evidence_sync: 0, audit_sync: 0, consent_approve: 0, consent_deny: 0, consent_revoke: 0 },
        ),
      );
      const retryingRows = rows.filter((row) => (row.attempts ?? 0) > 0);
      setQueueRetryingCount(retryingRows.length);
      setQueueMaxAttempts(rows.reduce((max, row) => Math.max(max, row.attempts ?? 0), 0));
      const latestErrored = [...retryingRows]
        .sort((a, b) => {
          if ((b.attempts ?? 0) !== (a.attempts ?? 0)) return (b.attempts ?? 0) - (a.attempts ?? 0);
          return (b.createdAt ?? 0) - (a.createdAt ?? 0);
        })
        .find((row) => typeof row.lastError === 'string' && row.lastError.trim().length > 0);
      setQueueLastError(latestErrored?.lastError?.trim() ?? null);
      setQueueLastErrorActionType(latestErrored?.actionType ?? null);
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
      setQueueNextRetrySeconds(nextRetryMs != null ? Math.ceil(nextRetryMs / 1000) : null);
    }

    const plotSnapshot = options?.plots ?? plots;
    const profileFarmerId = options?.farmerId?.trim() || farmer?.id?.trim() || '';
    const links = await loadPlotServerLinks().catch(() => ({}));
    if (applyDisplay) {
      setPlotServerLinks(links);
    }

    const canQueryServer = Boolean(profileFarmerId && hasSyncAuthSession());
    if (!canQueryServer) {
      if (applyDisplay) {
        setBackendPlots([]);
        setPlotsFetchState('idle');
        setMeasuredSyncPending({
          queuePendingCount: rows.length,
          unsyncedPlotCount: 0,
          blockedPlotCount: 0,
          total: rows.length,
          unsyncedPlotNames: [],
          blockedPlots: [],
        });
      }
      return;
    }
    if (applyDisplay) {
      setPlotsFetchState('loading');
    }
    let backend: unknown[] = [];
    try {
      backend = await fetchServerPlotListForUi({
        profileFarmerId,
        localPlots: plotSnapshot,
        ownedFarmerIds: options?.ownedFarmerIds,
        force: options?.forcePlotFetch === true,
      });
      if (applyDisplay) {
        setBackendPlots(backend ?? []);
        setPlotsFetchState('ok');
      }
    } catch (err) {
      const cached = peekServerPlotListCache({
        farmerId: profileFarmerId,
        ownedFarmerIds: options?.ownedFarmerIds,
      });
      if (cached?.length) {
        backend = cached;
        if (applyDisplay) {
          setBackendPlots(cached);
          setPlotsFetchState('ok');
        }
      } else if (applyDisplay) {
        if (isPlotFetchAuthFailure(err)) {
          setBackendPlots([]);
          setPlotsFetchState('idle');
        } else if (isPlotFetchReachabilityFailure(err)) {
          const access = await verifySyncAccessToken().catch(() => ({
            ok: false as const,
            reason: 'network' as const,
          }));
          const reachable = access.ok
            ? await probeTracebudApiReachable({ accessToken: access.token })
            : await probeTracebudApiReachable();
          setBackendPlots([]);
          setPlotsFetchState(reachable ? 'ok' : 'failed');
        } else {
          setBackendPlots([]);
          setPlotsFetchState('ok');
        }
      }
    }

    if (!applyDisplay) return;

    const pending = await measureTotalSyncPending({
      farmerId: profileFarmerId,
      ownedFarmerIds: options?.ownedFarmerIds,
      plots: plotSnapshot,
      isSignedIn: true,
      forcePlotFetch: options?.forcePlotFetch === true,
    });
    setMeasuredSyncPending(pending);
    setQueuePendingCount(pending.queuePendingCount);
  }, [farmer, plots]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await refreshSavedSyncEmail();
        await refreshSyncMetrics();
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
    }, [refreshSavedSyncEmail, refreshSyncMetrics, refreshPushPermission]),
  );

  useEffect(() => {
    void refreshSyncMetrics();
  }, [refreshSyncMetrics]);

  useEffect(() => {
    return subscribeServerPlotSyncChanged(() => {
      if (freezeSyncMetricsDisplayRef.current) return;
      void refreshSyncMetrics();
    });
  }, [refreshSyncMetrics]);

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
    setNameInput(farmer?.name ?? '');
  }, [farmer?.id, farmer?.name]);

  const unsyncedPlotCount = useMemo(() => {
    if (measuredSyncPending != null) return measuredSyncPending.unsyncedPlotCount;
    if (!isSignedIn || plots.length === 0) return 0;
    return listUnsyncedLocalPlots(plots, backendPlots, plotServerLinks).length;
  }, [measuredSyncPending, plots, backendPlots, plotServerLinks, isSignedIn]);

  const totalSyncPending =
    measuredSyncPending?.total ?? queuePendingCount + unsyncedPlotCount;

  const backupStatusLabel = useMemo(() => {
    if (isSyncInProgress) {
      return t('settings_backup_status_syncing');
    }
    if (!isSignedIn) {
      return totalSyncPending > 0
        ? t('settings_backup_status_pending', { n: totalSyncPending })
        : t('up_to_date');
    }
    if (plotsFetchState === 'failed') {
      return totalSyncPending > 0
        ? t('backup_waiting', { n: totalSyncPending })
        : t('settings_sync_reach_failed');
    }
    if (plotsFetchState === 'loading' && plots.length > 0) {
      return t('settings_backup_status_checking');
    }
    if (totalSyncPending > 0) {
      return t('backup_waiting', { n: totalSyncPending });
    }
    return t('backup_up_to_date');
  }, [isSignedIn, isSyncInProgress, plotsFetchState, plots.length, totalSyncPending, t]);

  const backupStatusNeedsAttention = useMemo(
    () =>
      isSignedIn &&
      (isSyncInProgress ||
        plotsFetchState === 'failed' ||
        plotsFetchState === 'loading' ||
        totalSyncPending > 0),
    [isSignedIn, isSyncInProgress, plotsFetchState, totalSyncPending],
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

  const syncApiBaseUrl = getTracebudApiBaseUrl();
  const syncUsesLocalApi = useMemo(() => isLocalLanSyncApi(syncApiBaseUrl), [syncApiBaseUrl]);
  const showBackupTechDetails = __DEV__ || syncUsesLocalApi;

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
      queuePendingBreakdown: queuePendingBreakdown || null,
    }),
    [
      isSignedIn,
      plotsFetchState,
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

  const backupAttentionPrimaryKind = useMemo(
    () =>
      pickBackupAttentionPrimaryKind({
        isSignedIn,
        queueLastError,
        queueLastErrorActionType,
        queuePendingCount,
        queueRetryingCount,
        queueMaxAttempts,
        queueNextRetrySeconds,
        unsyncedPlotCount,
        plotsFetchFailed: plotsFetchState === 'failed',
        queuePendingBreakdown: queuePendingBreakdown || null,
      }),
    [
      isSignedIn,
      plotsFetchState,
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

  const backupAttentionPrimarySummary = useMemo(() => {
    if (!backupAttentionPrimaryKind) return null;
    if (backupAttentionPrimaryKind === 'connectivity') {
      return t('settings_sync_reach_failed');
    }
    if (backupAttentionPrimaryKind === 'queue_error' && queueLastError) {
      return mapSyncActionErrorMessage(queueLastError, t, 'settings', {
        actionType: queueLastErrorActionType ?? undefined,
      });
    }
    if (backupAttentionPrimaryKind === 'unsynced_plots') {
      if (plotsFetchState === 'failed') {
        return t('settings_sync_plots_unreachable');
      }
      return t('settings_sync_unsynced_plots', { n: unsyncedPlotCount });
    }
    return t('settings_sync_waiting', { n: queuePendingCount });
  }, [
    backupAttentionPrimaryKind,
    plotsFetchState,
    queueLastError,
    queueLastErrorActionType,
    queuePendingCount,
    t,
    unsyncedPlotCount,
  ]);

  const pendingDetailMessage = useMemo(() => {
    if (totalSyncPending <= 0) return null;
    const plotCount = measuredSyncPending?.unsyncedPlotCount ?? unsyncedPlotCount;
    const blockedPlotCount = measuredSyncPending?.blockedPlotCount ?? 0;
    const queueCount = measuredSyncPending?.queuePendingCount ?? queuePendingCount;
    const names = measuredSyncPending?.unsyncedPlotNames ?? [];
    const blockedPlots = measuredSyncPending?.blockedPlots ?? [];
    return formatPendingSyncSummary(
      {
        total: totalSyncPending,
        unsyncedPlotCount: plotCount,
        blockedPlotCount,
        queuePendingCount: queueCount,
        unsyncedPlotNames: names,
        blockedPlots,
      },
      t,
    );
  }, [
    measuredSyncPending,
    queuePendingCount,
    t,
    totalSyncPending,
    unsyncedPlotCount,
  ]);

  const showBackupResultMessage = Boolean(syncMessage && !isSyncInProgress);

  const displayedSyncMessage = useMemo(() => {
    if (!syncMessage || isSyncInProgress) return null;
    if (totalSyncPending > 0 && pendingDetailMessage) {
      const generic = t('sync_result_incomplete', { n: totalSyncPending });
      if (syncMessageKind === 'success' || syncMessage === generic) {
        return pendingDetailMessage;
      }
    }
    return syncMessage;
  }, [
    isSyncInProgress,
    pendingDetailMessage,
    syncMessage,
    syncMessageKind,
    t,
    totalSyncPending,
  ]);

  const displayedSyncMessageKind = useMemo(() => {
    if (!displayedSyncMessage) return null;
    if (totalSyncPending > 0 && syncMessageKind === 'success') return 'error';
    return syncMessageKind;
  }, [displayedSyncMessage, syncMessageKind, totalSyncPending]);

  const syncGeometryWhyBlock = useMemo(
    () => primaryGeometryBlockForWhy(measuredSyncPending?.blockedPlots),
    [measuredSyncPending?.blockedPlots],
  );

  const showSyncGeometryWhy = syncGeometryWhyBlock != null && displayedSyncMessageKind === 'error';

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
    setNameInput(farmer?.name ?? '');
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
    setNameInput(farmer?.name ?? '');
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
          beginServerPlotFetchRun();
          try {
            await hydrateSyncAuthFromSettings();
            const syncAccess = await verifySyncAccessToken();
            if (!syncAccess.ok) {
              setSyncMessage(
                syncAccess.reason === 'network'
                  ? t('sync_auth_refresh_failed')
                  : t('sync_session_expired_short'),
              );
              setSyncMessageKind('error');
              return;
            }
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

            await warmPlotServerLinksForSync({
              farmerId: apiFarmerId,
              ownedFarmerIds: farmerScopeIds,
              localPlots: syncPlots,
            });

            const outcome: SyncNowUserOutcome = {};
            let plotUploadFirstError: string | undefined;
            let skipQueueDrain = false;
            const selectedTypes =
              selectedQueueActionTypes.length > 0 ? selectedQueueActionTypes : ALL_QUEUE_ACTION_TYPES;
            const queueDrainTypes = selectedTypes.filter((actionType) =>
              SYNC_DRAIN_ACTION_TYPES.includes(actionType),
            );
            const shouldProcessConsent = selectedTypes.some(isConsentQueueActionType);

            setSyncQueuePhase(
              syncPlots.length > 0 ? 'uploading_plots' : 'processing_queue',
            );

            let lastPlotUploadResult: Awaited<
              ReturnType<typeof uploadUnsyncedPlotsForFarmer>
            > | null = null;
            if (syncPlots.length === 0) {
              outcome.plotsNone = true;
            } else {
              let syncRes = await uploadUnsyncedPlotsForFarmer({
                farmerId: apiFarmerId,
                ownedFarmerIds: farmerScopeIds,
                localPlots: syncPlots,
                farmerDisplayName: syncFarmer?.name?.trim() || undefined,
                t,
                surface: 'settings',
              });
              if (!syncRes.fetchFailed && syncRes.unsyncedBefore === 0) {
                const verifyBeforeQueue = await measureTotalSyncPending({
                  farmerId: apiFarmerId,
                  ownedFarmerIds: farmerScopeIds,
                  plots: syncPlots,
                  isSignedIn: true,
                  forcePlotFetch: true,
                });
                if (verifyBeforeQueue.unsyncedPlotCount > 0) {
                  syncRes = await uploadUnsyncedPlotsForFarmer({
                    farmerId: apiFarmerId,
                    ownedFarmerIds: farmerScopeIds,
                    localPlots: syncPlots,
                    farmerDisplayName: syncFarmer?.name?.trim() || undefined,
                    t,
                    surface: 'settings',
                  });
                }
              }
              if (syncRes.stoppedForAuth) {
                setSyncMessage(t('sync_session_expired_short'));
                setSyncMessageKind('error');
                return;
              }
              if (syncRes.fetchFailed) {
                outcome.plotsFetchFailed = true;
                plotUploadFirstError = syncRes.firstError;
                skipQueueDrain = true;
              } else if (syncRes.unsyncedBefore === 0) {
                outcome.plotsAlreadySynced = true;
              } else if (syncRes.uploaded === syncRes.unsyncedBefore) {
                outcome.plotsUploadedAll = {
                  uploaded: syncRes.uploaded,
                  total: syncRes.unsyncedBefore,
                };
              } else {
                outcome.plotsPartial = {
                  uploaded: syncRes.uploaded,
                  total: syncRes.unsyncedBefore,
                  failed: syncRes.failed,
                };
                plotUploadFirstError = syncRes.firstError;
                skipQueueDrain = true;
              }
              lastPlotUploadResult = syncRes;
            }

            if (syncPlots.length > 0) {
              const plotServerLinks = await loadPlotServerLinks().catch(() => ({}));
              await enqueuePlotDependentSyncForLinkedPlots({
                farmerId: apiFarmerId,
                farmer: syncFarmer,
                plots: syncPlots,
                plotServerLinks,
              }).catch(() => undefined);
            }

            const mergeQueueResult = (
              queueRes: Awaited<ReturnType<typeof processPendingSyncQueue>>,
            ) => {
              if (
                queueRes.fetchFailed &&
                queueRes.completed === 0 &&
                queueRes.failedActions === 0 &&
                queueRes.droppedInvalid === 0
              ) {
                outcome.queueFetchFailed = true;
                return;
              }
              outcome.queueCompleted = (outcome.queueCompleted ?? 0) + queueRes.completed;
              outcome.queueFailed = (outcome.queueFailed ?? 0) + queueRes.failedActions;
            };

            let queueFirstError: string | undefined;

            if (shouldProcessConsent) {
              setSyncQueuePhase('processing_consent');
              const consentRes = await processPendingConsentQueue();
              outcome.queueCompleted = (outcome.queueCompleted ?? 0) + consentRes.completed;
              outcome.queueFailed = (outcome.queueFailed ?? 0) + consentRes.failedActions;
            }

            if (queueDrainTypes.length > 0 && !skipQueueDrain) {
              setSyncQueuePhase('processing_queue');
              if (__DEV__ && queueSmartSweepEnabled) {
                const retryingPass = await processPendingSyncQueue({
                  farmerId: apiFarmerId,
                  localPlots: syncPlots,
                  farmerScopeIds,
                  actionTypes: queueDrainTypes,
                  attemptScope: 'retrying_only',
                  maxActions: queueSmartSweepCap,
                  ignoreBackoff: true,
                  accessToken: syncAccess.token,
                });
                mergeQueueResult(retryingPass);
                if (retryingPass.firstError) queueFirstError = retryingPass.firstError;
                const firstPassProcessed =
                  retryingPass.completed + retryingPass.failedActions + retryingPass.droppedInvalid;
                const remainingBudget = Math.max(0, queueSmartSweepCap - firstPassProcessed);
                if (!retryingPass.fetchFailed && remainingBudget > 0) {
                  const firstAttemptPass = await processPendingSyncQueue({
                    farmerId: apiFarmerId,
                    localPlots: syncPlots,
                    farmerScopeIds,
                    actionTypes: queueDrainTypes,
                    attemptScope: 'first_attempt_only',
                    maxActions: remainingBudget,
                    ignoreBackoff: true,
                    accessToken: syncAccess.token,
                  });
                  mergeQueueResult(firstAttemptPass);
                  if (firstAttemptPass.firstError) queueFirstError = firstAttemptPass.firstError;
                }
              } else {
                const queueRes = await drainPendingSyncQueueForManualSync({
                  farmerId: apiFarmerId,
                  localPlots: syncPlots,
                  farmerScopeIds,
                  actionTypes: queueDrainTypes,
                  attemptScope: 'all',
                  maxPasses: 4,
                  accessToken: syncAccess.token,
                });
                mergeQueueResult(queueRes);
                if (queueRes.firstError) queueFirstError = queueRes.firstError;
              }
            }

            invalidateServerPlotListCache();
            const pendingAfter = await measureTotalSyncPending({
              farmerId: apiFarmerId,
              ownedFarmerIds: farmerScopeIds,
              plots: syncPlots,
              isSignedIn: true,
              forcePlotFetch: true,
            });
            outcome.remainingPending = pendingAfter.total;
            outcome.unsyncedPlotCount = pendingAfter.unsyncedPlotCount;
            outcome.blockedPlotCount = pendingAfter.blockedPlotCount;
            outcome.unsyncedPlotNames = pendingAfter.unsyncedPlotNames;
            outcome.blockedPlots = pendingAfter.blockedPlots;
            outcome.queuePendingCount = pendingAfter.queuePendingCount;
            if (pendingAfter.plotsFetchFailed) {
              outcome.plotsFetchFailed = true;
            }

            const errored =
              outcome.remainingPending > 0
                ? (await loadPendingSyncActions().catch(() => [])).find(
                    (row) => typeof row.lastError === 'string' && row.lastError.trim().length > 0,
                  )
                : undefined;
            const plotHint = plotUploadFirstError
              ? mapPlotUploadErrorMessage(plotUploadFirstError, t, { surface: 'settings' })
              : undefined;
            const queueRowHint = errored?.lastError
              ? mapSyncActionErrorMessage(errored.lastError, t, 'settings', {
                  actionType: errored.actionType,
                })
              : undefined;
            const queuePassHint = queueFirstError
              ? mapSyncActionErrorMessage(queueFirstError, t, 'settings')
              : undefined;
            outcome.failureReason = plotHint ?? queueRowHint ?? queuePassHint;
            if (
              !outcome.failureReason?.trim() &&
              pendingAfter.plotsFetchFailed &&
              pendingAfter.unsyncedPlotCount > 0
            ) {
              outcome.failureReason = t('sync_reach_failed_short');
            } else if (
              !outcome.failureReason?.trim() &&
              pendingAfter.blockedPlots.length === 1
            ) {
              const block = pendingAfter.blockedPlots[0];
              outcome.failureReason =
                block.code === 'GEO-105'
                  ? `${block.message} ${t('geo_quality_overlap_upload_support')}`
                  : block.message;
              if (block.code === 'GEO-105') {
                outcome.supportMailto = block.supportMailto;
              }
            } else if (
              !outcome.failureReason?.trim() &&
              pendingAfter.unsyncedPlotCount > 0
            ) {
              const names = pendingAfter.unsyncedPlotNames.filter(Boolean).join(', ');
              if (lastPlotUploadResult?.unsyncedBefore === 0) {
                outcome.failureReason = names
                  ? t('settings_sync_plot_not_confirmed_on_server', { names })
                  : t('settings_sync_plot_upload_not_attempted');
              }
            }

            await reloadFromDisk();
            diskState = await loadAppState().catch(() => ({ plots: syncPlots }));
            await refreshSyncMetrics({
              forcePlotFetch: true,
              farmerId: apiFarmerId,
              ownedFarmerIds: farmerScopeIds,
              plots: diskState.plots.length > 0 ? diskState.plots : syncPlots,
            });

            const syncResultMessage = formatSyncNowUserMessage(outcome, t);
            let finalSyncMessage = syncResultMessage;
            if (outcome.remainingPending === 0 && syncResultMessage === t('sync_result_complete')) {
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
                syncResultMessage,
                names,
                t,
              );
            }
            setSyncMessage(finalSyncMessage);
            setSyncSupportMailto(resolveSyncSupportMailto(outcome) ?? null);
            setSyncOpenPlotId(resolveSyncOpenPlotId(outcome) ?? null);
            setSyncMessageKind(outcome.remainingPending === 0 ? 'success' : 'error');
          } catch (e) {
            if (e instanceof SyncOperationTimeoutError) {
              setSyncMessage(syncTimedOutMessage(t, 'settings'));
              setSyncMessageKind('error');
              return;
            }
            const message = e instanceof Error ? e.message : String(e);
            setSyncMessage(
              isNetworkReachabilityFailure(message)
                ? t('sync_reach_failed_short')
                : t('sync_result_incomplete', { n: totalSyncPending }),
            );
            setSyncMessageKind('error');
          } finally {
            endServerPlotFetchRun();
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
        setSyncMessage(syncTimedOutMessage(t, 'settings'));
        setSyncMessageKind('error');
        return;
      }
      const message = e instanceof Error ? e.message : String(e);
      setSyncMessage(
        isNetworkReachabilityFailure(message)
          ? t('sync_reach_failed_short')
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
        textInverseColor={colors.textInverse}
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
                      {farmer?.name?.trim() ? farmer.name.trim() : t('profile_no_name')}
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
                      backupStatusNeedsAttention ? styles.backupStatusPending : styles.backupStatusOk,
                    ]}
                  >
                    {backupStatusLabel}
                  </ThemedText>
                </View>
                <ThemedText type="caption" style={styles.backupIntroText}>
                  {t('settings_backup_sync_body')}
                </ThemedText>
                {syncUsesLocalApi && !backupTechOpen ? (
                  <ThemedText type="caption" style={styles.mutedText}>
                    {t('settings_sync_test_build_short')}
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
                        displayedSyncMessageKind === 'success' && styles.syncHintSuccess,
                        displayedSyncMessageKind === 'error' && styles.syncHintError,
                      ]}
                    >
                      {displayedSyncMessage}
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
                        {__DEV__ && queuePendingBreakdown ? (
                          <ThemedText type="caption" style={styles.backupTechDetailText}>
                            {queuePendingBreakdown}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Spacing['2xl'],
    gap: 12,
  },
  sectionTitleAbove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    marginBottom: 0,
  },
  sectionTitleAboveText: {
    color: '#111111',
  },
  card: { marginTop: 0 },
  cardInner: {
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionLabel: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333333',
  },
  btnWrap: {
    marginTop: 8,
  },
  syncHint: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
  },
  syncResultBlock: {
    marginTop: 6,
    gap: 8,
  },
  syncHintSuccess: {
    color: '#0A7F59',
    fontWeight: '600',
  },
  syncHintError: {
    color: '#B45309',
    fontWeight: '600',
  },
  syncWhyLink: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 2,
  },
  syncWhyLinkText: {
    color: '#0A7F59',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  syncQueueWarningText: {
    color: '#8A5A00',
  },
  uploadIssuePanel: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    overflow: 'hidden',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  uploadIssueHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  uploadIssueSummary: {
    flex: 1,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 20,
  },
  uploadIssueBody: {
    gap: 6,
    marginTop: 2,
  },
  backupDetailsToggle: {
    color: Brand.primary,
    fontWeight: '600',
  },
  backupTechToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
    paddingVertical: 4,
  },
  backupTechToggleText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  backupTechBody: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    gap: 6,
  },
  backupTechDetailText: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
  },
  syncQueueFilterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  syncQueueFilterChip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
  },
  syncQueueFilterChipActive: {
    borderColor: Brand.primary,
    backgroundColor: '#E8F8F1',
  },
  syncQueueFilterChipTextActive: {
    color: Brand.primary,
  },
  rowHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameInputWrap: {
    marginBottom: 8,
  },
  profileReadonlyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
    alignSelf: 'stretch',
  },
  profileReadonlyTextCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  profileReadonlyName: {
    textAlign: 'left',
    color: '#111111',
  },
  profileReadonlyLocation: {
    textAlign: 'left',
    marginTop: 0,
  },
  profileReadonlyField: {
    alignSelf: 'stretch',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  profileReadonlyLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: '#666666',
    marginBottom: 4,
  },
  profileReadonlyValue: {
    fontSize: 16,
    lineHeight: 22,
    color: '#111111',
  },
  profileEditActions: {
    gap: 10,
    marginTop: 16,
    paddingTop: 4,
  },
  profileAccountSection: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
    gap: 4,
  },
  profileSignOutRow: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  profileSignOutLink: {
    color: Brand.primary,
    fontWeight: '600',
  },
  avatarWrap: {
    position: 'relative',
  },
  userAvatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D8F2E7',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#AEE6D3',
    flexShrink: 0,
  },
  avatarCameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  changeLink: { justifyContent: 'center', paddingVertical: 8 },
  changeLinkText: {
    fontSize: 16,
    lineHeight: 22,
    color: Brand.primary,
    textDecorationLine: 'underline',
  },
  mutedText: {
    color: '#666666',
    marginTop: 0,
    fontSize: 15,
    lineHeight: 22,
  },
  backupIntroText: {
    marginTop: 6,
    color: '#666666',
    lineHeight: 20,
  },
  backupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  notificationsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  backupStatusText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  backupStatusOk: {
    color: Brand.success,
  },
  backupStatusPending: {
    color: Brand.warning,
  },
  backupStatusMuted: {
    color: '#666666',
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  advancedBody: {
    marginTop: 12,
    gap: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  advancedSection: {
    gap: 8,
  },
  advancedSectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: '#111111',
  },
  dataSharingRow: {
    gap: 12,
  },
  dataSharingRowMain: {
    gap: 6,
  },
  dataSharingRowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  greenText: {
    color: '#0A7F59',
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
  },
  storageBarTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E5E5E5',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  storageBarSegment: {
    height: '100%',
    backgroundColor: '#1CC08B',
  },
  storageBarSegmentMaps: {
    backgroundColor: '#3B82F6',
  },
  storageBarSegmentData: {
    backgroundColor: '#8B5CF6',
  },
  storageBreakdownText: {
    color: '#666666',
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  helpCard: {
    backgroundColor: '#EAF8F2',
    borderColor: '#AEE6D3',
  },
  helpTipsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingVertical: 6,
  },
  helpFarmerTips: {
    color: '#1F6B57',
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },
  helpTipsContent: {
    gap: 4,
    marginTop: 4,
  },
  helpTipsSectionTitle: {
    color: '#0B4F3B',
    marginTop: 8,
    fontSize: 14,
  },
});


import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
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
  fetchPlotsForFarmer,
  getTracebudApiBaseUrl,
  postAuditEventToBackend,
  testBackendLogin,
} from '@/features/api/postPlot';
import {
  clearPersistedSyncAuth,
  getAuthCredentials,
  hasSyncAuthSession,
  hydrateSyncAuthFromSettings,
} from '@/features/api/syncAuthSession';
import {
  buildDeclarationBundle,
  declarationBundleToJson,
} from '@/features/compliance/declarationBundle';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getSetting,
  loadPendingSyncActions,
  setSetting,
  type PendingSyncAction,
} from '@/features/state/persistence';
import {
  listUnsyncedLocalPlots,
  subscribeServerPlotSyncChanged,
  uploadUnsyncedPlotsForFarmer,
} from '@/features/sync/plotServerSync';
import { processPendingSyncQueue } from '@/features/sync/processPendingSyncQueue';
import { withSyncQueueLock } from '@/features/sync/syncQueueMutex';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import { SetPasswordCard } from '@/components/auth/SetPasswordCard';
import {
  footprintBytesToMb,
  measureTracebudStorageFootprint,
  type TracebudStorageFootprint,
} from '@/features/storage/measureTracebudFootprint';
import { useAppState } from '@/features/state/AppStateContext';
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
  const { farmer, plots, setFarmer, updateFarmerProfilePhoto } = useAppState();
  const { refreshAuth, openSignIn } = useSignInSheet();
  const [nameInput, setNameInput] = useState('');
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncNowBusy, setSyncNowBusy] = useState(false);
  const [declarationBusy, setDeclarationBusy] = useState(false);
  /** SQLite queue: harvests, photo sync, evidence sync (not plot geometry upload). */
  const [queuePendingCount, setQueuePendingCount] = useState(0);
  const [queueRetryingCount, setQueueRetryingCount] = useState(0);
  const [queueMaxAttempts, setQueueMaxAttempts] = useState(0);
  const [queueLastError, setQueueLastError] = useState<string | null>(null);
  const [queueLastErrorActionType, setQueueLastErrorActionType] = useState<string | null>(null);
  const [queueNextRetrySeconds, setQueueNextRetrySeconds] = useState<number | null>(null);
  const [queueCountByActionType, setQueueCountByActionType] = useState<
    Record<PendingSyncAction['actionType'], number>
  >({
    harvest: 0,
    photos_sync: 0,
    evidence_sync: 0,
    consent_approve: 0,
    consent_deny: 0,
    consent_revoke: 0,
  });
  /** Local plots with no matching server row (by name). */
  const [backendPlots, setBackendPlots] = useState<unknown[]>([]);
  const [plotsFetchState, setPlotsFetchState] = useState<'idle' | 'loading' | 'ok' | 'failed'>('idle');
  const [syncEmail, setSyncEmail] = useState('');
  const [syncAuthHint, setSyncAuthHint] = useState<string | null>(null);
  const [syncSignedIn, setSyncSignedIn] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [helpTipsOpen, setHelpTipsOpen] = useState(false);
  const [queueDetailsOpen, setQueueDetailsOpen] = useState(false);
  const [vertexAvgSeconds, setVertexAvgSeconds] = useState<60 | 120>(120);
  const [queueActionFilter, setQueueActionFilter] = useState<
    Record<PendingSyncAction['actionType'], boolean>
  >({
    harvest: true,
    photos_sync: true,
    evidence_sync: true,
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
    await hydrateSyncAuthFromSettings();
    const { email } = getAuthCredentials();
    if (email) setSyncEmail(email);
    setSyncSignedIn(hasSyncAuthSession());
  }, []);

  const refreshSyncMetrics = useCallback(async () => {
    const rows = await loadPendingSyncActions().catch(() => []);
    setQueuePendingCount(rows.length);
    setQueueCountByActionType(
      rows.reduce<Record<PendingSyncAction['actionType'], number>>(
        (acc, row) => {
          acc[row.actionType] += 1;
          return acc;
        },
        { harvest: 0, photos_sync: 0, evidence_sync: 0, consent_approve: 0, consent_deny: 0, consent_revoke: 0 },
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

    const canQueryServer = Boolean(farmer?.id && hasSyncAuthSession());
    if (!canQueryServer) {
      setBackendPlots([]);
      setPlotsFetchState('idle');
      return;
    }
    setPlotsFetchState('loading');
    try {
      const backend = await fetchPlotsForFarmer(farmer!.id);
      setBackendPlots(backend ?? []);
      setPlotsFetchState('ok');
    } catch {
      // Match home screen: empty server list ⇒ treat local plots as not verified until reachable.
      setBackendPlots([]);
      setPlotsFetchState('failed');
    }
  }, [farmer, plots]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await refreshSavedSyncEmail();
        await refreshSyncMetrics();
        await refreshPushPermission();
        const v = await getSetting('vertexAveragingSeconds').catch(() => null);
        setVertexAvgSeconds(v === '60' ? 60 : 120);
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
      void refreshSyncMetrics();
    });
  }, [refreshSyncMetrics]);

  useEffect(() => {
    setNameInput(farmer?.name ?? '');
  }, [farmer?.id, farmer?.name]);

  const unsyncedPlotCount = useMemo(() => {
    if (!syncSignedIn || plots.length === 0) return 0;
    return listUnsyncedLocalPlots(plots, backendPlots).length;
  }, [plots, backendPlots, syncSignedIn]);

  const totalSyncPending = queuePendingCount + unsyncedPlotCount;

  const backupStatusLabel = useMemo(() => {
    if (!syncSignedIn) {
      return totalSyncPending > 0
        ? t('settings_backup_status_pending', { n: totalSyncPending })
        : t('up_to_date');
    }
    if (plotsFetchState === 'failed') {
      return totalSyncPending > 0
        ? t('backup_waiting', { n: totalSyncPending })
        : t('sync_plots_fetch_failed');
    }
    if (plotsFetchState === 'loading' && plots.length > 0) {
      return t('settings_backup_status_checking');
    }
    if (totalSyncPending > 0) {
      return t('backup_waiting', { n: totalSyncPending });
    }
    return t('backup_up_to_date');
  }, [syncSignedIn, plotsFetchState, plots.length, totalSyncPending, t]);

  const backupStatusNeedsAttention = useMemo(
    () =>
      syncSignedIn &&
      (plotsFetchState === 'failed' || plotsFetchState === 'loading' || totalSyncPending > 0),
    [syncSignedIn, plotsFetchState, totalSyncPending],
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
    if (!syncSignedIn) {
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

  const displayProfileEmail = syncSignedIn
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

  const onSignOutSync = async () => {
    await unregisterFarmerPushToken().catch(() => undefined);
    await clearPersistedSyncAuth();
    setSyncSignedIn(false);
    setSyncEmail('');
    setSyncAuthHint(t('signed_out_device'));
    setSyncMessage(null);
    await refreshAuth();
    void refreshSyncMetrics();
  };

  const runSyncNow = async () => {
    setSyncNowBusy(true);
    setSyncMessage(null);
    try {
      await withSyncQueueLock(async () => {
      const res = await testBackendLogin();
      if (!res.ok) {
        setSyncMessage(res.message);
        return;
      }
      if (!farmer?.id) {
        setSyncMessage(t('sync_no_farmer_profile'));
        return;
      }

      const parts: string[] = [];

      if (plots.length === 0) {
        parts.push(t('sync_plots_none'));
      } else {
        const syncRes = await uploadUnsyncedPlotsForFarmer({
          farmerId: farmer.id,
          localPlots: plots,
          t,
        });
        if (syncRes.stoppedForAuth) {
          parts.push(t('sync_session_expired_short'));
        } else if (syncRes.fetchFailed) {
          parts.push(t('sync_plots_fetch_failed'));
        } else if (syncRes.unsyncedBefore === 0) {
          parts.push(t('sync_plots_already_synced'));
        } else if (syncRes.uploaded === syncRes.unsyncedBefore) {
          parts.push(
            t('sync_plots_uploaded_all', {
              uploaded: syncRes.uploaded,
              total: syncRes.unsyncedBefore,
            }),
          );
        } else {
          parts.push(
            t('sync_plots_partial', {
              uploaded: syncRes.uploaded,
              total: syncRes.unsyncedBefore,
              failed: syncRes.failed,
            }) + (syncRes.firstError ? `\n${syncRes.firstError}` : ''),
          );
        }
      }

      const appendQueueResultParts = (
        queueRes: Awaited<ReturnType<typeof processPendingSyncQueue>>,
        label?: string,
      ) => {
        if (label) parts.push(label);
        if (queueRes.fetchFailed) {
          parts.push(t('sync_queue_fetch_failed'));
          return;
        }
        if (queueRes.completed > 0) {
          parts.push(t('sync_queue_sent', { n: queueRes.completed }));
        }
        if (queueRes.droppedInvalid > 0) {
          parts.push(t('sync_queue_dropped_invalid', { n: queueRes.droppedInvalid }));
        }
        if (queueRes.failedActions > 0) {
          parts.push(t('sync_queue_failed_remain', { n: queueRes.failedActions }));
          if (queueRes.firstError) parts.push(queueRes.firstError);
        }
      };
      if (selectedQueueActionTypes.length === 0) {
        parts.push(t('sync_queue_no_action_selected'));
      } else if (queueSmartSweepEnabled) {
        const retryingPass = await processPendingSyncQueue({
          farmerId: farmer.id,
          localPlots: plots,
          actionTypes: selectedQueueActionTypes,
          attemptScope: 'retrying_only',
          maxActions: queueSmartSweepCap,
        });
        appendQueueResultParts(retryingPass, t('sync_queue_smart_pass_retrying'));
        const firstPassProcessed =
          retryingPass.completed + retryingPass.failedActions + retryingPass.droppedInvalid;
        const remainingBudget = Math.max(0, queueSmartSweepCap - firstPassProcessed);
        if (!retryingPass.fetchFailed) {
          if (remainingBudget > 0) {
            const firstAttemptPass = await processPendingSyncQueue({
              farmerId: farmer.id,
              localPlots: plots,
              actionTypes: selectedQueueActionTypes,
              attemptScope: 'first_attempt_only',
              maxActions: remainingBudget,
            });
            appendQueueResultParts(firstAttemptPass, t('sync_queue_smart_pass_first'));
          } else {
            parts.push(t('sync_queue_smart_cap_reached'));
          }
        }
      } else {
        const queueRes = await processPendingSyncQueue({
          farmerId: farmer.id,
          localPlots: plots,
          actionTypes: selectedQueueActionTypes,
          attemptScope: queueAttemptScope,
        });
        appendQueueResultParts(queueRes);
      }

      setSyncMessage(parts.filter(Boolean).join('\n\n'));
      });
    } finally {
      setSyncNowBusy(false);
      await refreshSyncMetrics();
    }
  };

  const shareDeclarationBundle = async () => {
    if (!farmer) {
      Alert.alert(t('warning'), t('declaration_export_no_farmer'));
      return;
    }
    const bundle = buildDeclarationBundle({
      farmer,
      plots,
      appVersion: Constants.expoConfig?.version ?? null,
    });
    const json = declarationBundleToJson(bundle);
    try {
      if (Platform.OS === 'web') {
        await Share.share({ message: json, title: 'Tracebud' });
        return;
      }
      const dir = fsAny.cacheDirectory;
      if (!dir) {
        await Share.share({ message: json });
        return;
      }
      const path = `${dir}tracebud-declaration-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'application/json', UTI: 'public.json' });
      } else {
        await Share.share({ message: json });
      }
    } catch (e) {
      Alert.alert(t('warning'), e instanceof Error ? e.message : String(e));
    }
  };

  const syncDeclarationSnapshotToServer = async () => {
    if (!farmer) {
      Alert.alert(t('warning'), t('declaration_export_no_farmer'));
      return;
    }
    const login = await testBackendLogin();
    if (!login.ok) {
      Alert.alert(t('warning'), login.message);
      return;
    }
    setDeclarationBusy(true);
    try {
      const bundle = buildDeclarationBundle({
        farmer,
        plots,
        appVersion: Constants.expoConfig?.version ?? null,
      });
      const res = await postAuditEventToBackend({
        eventType: 'offline_declaration_bundle',
        payload: { ...bundle, farmerId: farmer.id },
        deviceId: Constants.deviceName ?? null,
      });
      if (!res.ok) {
        Alert.alert(
          t('warning'),
          res.reason === 'no_access_token'
            ? t('declaration_sync_need_signin')
            : res.message ?? t('declaration_sync_failed'),
        );
        return;
      }
      Alert.alert(t('declaration_sync_ok_title'), t('declaration_sync_ok_body'));
    } finally {
      setDeclarationBusy(false);
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
                {syncSignedIn && plotsFetchState === 'failed' && totalSyncPending > 0 ? (
                  <ThemedText type="caption" style={styles.syncQueueWarningText}>
                    {t('sync_plots_fetch_failed')}
                  </ThemedText>
                ) : null}

                {syncSignedIn ? (
                  <View style={styles.backupAccountRow}>
                    <ThemedText type="caption" style={styles.backupAccountEmail} numberOfLines={1}>
                      {syncEmail.trim() ? syncEmail : getAuthCredentials().email || '—'}
                    </ThemedText>
                    <Pressable onPress={() => void onSignOutSync()} hitSlop={8}>
                      <ThemedText type="caption" style={styles.backupSignOutLink}>
                        {t('sign_out_device')}
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : null}

                <SetPasswordCard
                  signedIn={syncSignedIn}
                  t={t}
                  onPasswordSaved={() => {
                    void refreshSavedSyncEmail();
                  }}
                />

                <View style={styles.btnWrap}>
                  {syncSignedIn ? (
                    <Button
                      variant={totalSyncPending > 0 ? 'primary' : 'secondary'}
                      size="md"
                      fullWidth
                      loading={syncNowBusy}
                      disabled={syncNowBusy}
                      onPress={() => void runSyncNow()}
                    >
                      {t('sync_now')}
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
                            setSyncAuthHint(null);
                          },
                        })
                      }
                    >
                      {t('sign_in_to_backup_title')}
                    </Button>
                  )}
                </View>

                {syncMessage ? (
                  <ThemedText type="caption" style={styles.syncHint}>
                    {syncMessage}
                  </ThemedText>
                ) : null}
                {syncAuthHint ? (
                  <ThemedText type="caption" style={styles.syncAuthHint}>
                    {syncAuthHint}
                  </ThemedText>
                ) : null}
                {queuePendingCount > 0 && queueLastError ? (
                  <ThemedText type="caption" style={styles.syncQueueWarningText}>
                    {t('settings_sync_upload_issue')}
                  </ThemedText>
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
                      disabled={pushRegisterBusy || !syncSignedIn}
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
                  {!syncSignedIn ? (
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
                        {t('settings_vertex_avg_title')}
                      </ThemedText>
                      <ThemedText type="caption" style={styles.mutedText}>
                        {t('settings_vertex_avg_body')}
                      </ThemedText>
                      <View style={styles.vertexAvgRow}>
                        <Pressable
                          onPress={() => {
                            setVertexAvgSeconds(60);
                            void setSetting('vertexAveragingSeconds', '60');
                          }}
                          style={[
                            styles.vertexAvgChip,
                            vertexAvgSeconds === 60 && styles.vertexAvgChipSelected,
                          ]}
                        >
                          <ThemedText
                            type="defaultSemiBold"
                            style={vertexAvgSeconds === 60 ? styles.vertexAvgChipTextSelected : undefined}
                          >
                            {t('settings_vertex_60')}
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setVertexAvgSeconds(120);
                            void setSetting('vertexAveragingSeconds', '120');
                          }}
                          style={[
                            styles.vertexAvgChip,
                            vertexAvgSeconds === 120 && styles.vertexAvgChipSelected,
                          ]}
                        >
                          <ThemedText
                            type="defaultSemiBold"
                            style={vertexAvgSeconds === 120 ? styles.vertexAvgChipTextSelected : undefined}
                          >
                            {t('settings_vertex_120')}
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>

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

                    <View style={styles.advancedSection}>
                      <ThemedText type="defaultSemiBold" style={styles.advancedSectionTitle}>
                        {t('declaration_audit_section')}
                      </ThemedText>
                      <ThemedText type="caption" style={styles.mutedText}>
                        {t('declaration_audit_body')}
                      </ThemedText>
                      <View style={styles.btnWrap}>
                        <Button variant="outline" size="md" fullWidth onPress={() => void shareDeclarationBundle()}>
                          {t('declaration_export_json')}
                        </Button>
                      </View>
                      <Button
                        variant="secondary"
                        size="md"
                        fullWidth
                        loading={declarationBusy}
                        disabled={declarationBusy}
                        onPress={() => void syncDeclarationSnapshotToServer()}
                      >
                        {t('declaration_sync_server')}
                      </Button>
                    </View>

                    {queuePendingCount > 0 ? (
                      <View style={styles.advancedSection}>
                        <ThemedText type="defaultSemiBold" style={styles.advancedSectionTitle}>
                          {t('settings_sync_show_details')}
                        </ThemedText>
                        <Pressable
                          onPress={() => setQueueDetailsOpen((open) => !open)}
                          style={styles.queueDetailsToggle}
                          accessibilityRole="button"
                        >
                          <ThemedText type="defaultSemiBold" style={styles.greenText}>
                            {queueDetailsOpen
                              ? t('settings_sync_hide_details')
                              : t('settings_sync_show_details')}
                          </ThemedText>
                          <Ionicons
                            name={queueDetailsOpen ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={Brand.primary}
                          />
                        </Pressable>
                        {queueDetailsOpen ? (
                          <View style={styles.syncQueueHealth}>
                            <ThemedText type="caption">
                              {t('sync_queue_health_summary', {
                                pending: queuePendingCount,
                                retrying: queueRetryingCount,
                                max: queueMaxAttempts,
                              })}
                            </ThemedText>
                            {queueLastError ? (
                              <ThemedText type="caption" style={styles.syncQueueWarningText}>
                                {t('sync_queue_latest_error_label')}
                                {queueLastErrorActionType ? ` (${queueLastErrorActionType})` : ''}:{' '}
                                {queueLastError}
                              </ThemedText>
                            ) : null}
                            {queueNextRetrySeconds != null ? (
                              <ThemedText type="caption" style={styles.syncQueueWarningText}>
                                {t('sync_queue_next_retry_in', { seconds: queueNextRetrySeconds })}
                              </ThemedText>
                            ) : null}
                            {__DEV__ ? (
                              <>
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
                                        queueSmartSweepEnabled
                                          ? styles.syncQueueFilterChipTextActive
                                          : undefined
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
                                    <ThemedText type="caption">
                                      {t('sync_queue_reset_preferences_label')}
                                    </ThemedText>
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
                                            style={
                                              enabled ? styles.syncQueueFilterChipTextActive : undefined
                                            }
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
                                          style={
                                            enabled ? styles.syncQueueFilterChipTextActive : undefined
                                          }
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
                                          style={
                                            enabled ? styles.syncQueueFilterChipTextActive : undefined
                                          }
                                        >
                                          {label} ({count})
                                        </ThemedText>
                                      </Pressable>
                                    );
                                  })}
                                </View>
                              </>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    {__DEV__ ? (
                      <ThemedText type="caption" style={styles.mutedText}>
                        {t('settings_api_base')}: {getTracebudApiBaseUrl()}
                      </ThemedText>
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
                  <ThemedText type="caption" style={styles.helpFarmerTips}>
                    {t('help_farmer_body')}
                  </ThemedText>
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
  syncQueueHealth: {
    marginTop: 8,
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  syncQueueWarningText: {
    color: '#8A5A00',
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
  backupAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  backupAccountEmail: {
    flex: 1,
    color: '#444444',
  },
  backupSignOutLink: {
    color: Brand.primary,
    fontWeight: '600',
  },
  queueDetailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingVertical: 4,
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
  syncAuthHint: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },
  vertexAvgRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  vertexAvgChip: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  vertexAvgChipSelected: {
    borderColor: Brand.primary,
    backgroundColor: '#E8F8F1',
  },
  vertexAvgChipTextSelected: {
    color: Brand.primary,
  },
});


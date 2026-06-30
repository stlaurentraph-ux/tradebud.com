import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import {
  abortSyncAuthForSignOut,
  clearPersistedSyncAuth,
  getAuthUiGeneration,
  hasSyncAuthSession,
  hydrateSyncAuthFromSettings,
  isSyncAuthSignedOutOnDevice,
  testBackendLogin,
  verifySyncAccessToken,
} from '@/features/api/syncAuthSession';
import { getAuthCredentials } from '@/features/api/postPlot';
import { AuthSheetScrollCard } from '@/components/auth/AuthSheetScrollCard';
import { BackupConsentModal } from '@/components/auth/BackupConsentModal';
import { CreateAccountWizard } from '@/components/auth/CreateAccountWizard';
import { OAuthProviderButtons } from '@/components/auth/OAuthProviderButtons';
import { createAuthSheetStyles } from '@/components/auth/authSheetStyles';
import { WelcomeAccountModal } from '@/components/auth/WelcomeAccountModal';
import { fetchPlotsForFarmer } from '@/features/api/postPlot';
import { clearFieldProducerBootstrapCache } from '@/features/api/fieldAppBootstrap';
import { showOAuthSignInFailureAlert } from '@/features/auth/oauthSignInAlerts';
import { isOAuthCallbackUrl, sessionFromOAuthCallbackUrl } from '@/features/auth/oauthCallbackUrl';
import { deliverOAuthCallbackUrl } from '@/features/auth/oauthCallbackBridge';
import { completeOAuthFarmerSession } from '@/features/auth/completeOAuthFarmerSession';
import { alignFarmerWithAuthUser } from '@/features/auth/alignFarmerWithAuthUser';
import {
  accountHasCloudFieldData,
  rememberLastAuthenticatedEmail,
  type AccountSwitchResolution,
} from '@/features/auth/accountSwitchLocalState';
import {
  bootstrapFarmerProfile,
  shouldUpdateBootstrappedFarmer,
} from '@/features/auth/farmerProfileBootstrap';
import { getAuthenticatedSupabaseUserId } from '@/features/api/syncAuthSession';
import { formatSignInErrorMessage } from '@/features/auth/mapAuthError';
import { normalizeAuthAnalyticsReason } from '@/features/auth/authAnalyticsReason';
import { signInAndSyncPlots, signInWithOAuthAndSyncPlots } from '@/features/auth/signInSync';
import { hasDataProcessingConsent } from '@/features/compliance/dataProcessingConsent';
import { runBackupWithConsent } from '@/features/sync/backupWithConsent';
import { runAutoBackup, type RunAutoBackupResult } from '@/features/sync/runAutoBackup';
import {
  listUnsyncedLocalPlots,
} from '@/features/sync/plotServerSync';
import {
  countServerPlotsForPostAuthRestore,
  countServerVouchersForPostAuthRestore,
  postAuthSyncPlotCountHint,
  shouldOfferPostAuthSync,
} from '@/features/sync/postAuthSyncOffer';
import type { OAuthProvider } from '@/features/auth/oauthSignIn';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { useAppState } from '@/features/state/AppStateContext';
import { shouldUseMaestroCiThinBoot } from '@/features/testing/maestroCiBootProfile';
import { useLanguage } from '@/features/state/LanguageContext';
import { getSetting, loadAppState, loadLocalDeliveryReceiptsForFarmer, loadPendingSyncActions, setSetting, adoptOnDeviceFarmerScope } from '@/features/state/persistence';
import { unregisterFarmerPushToken } from '@/features/notifications/registerFarmerPushToken';

const ACCOUNT_WELCOME_DISMISSED_KEY = 'account_welcome_dismissed';

function buildBackupOutcomeMessage(backup: RunAutoBackupResult | null, t: (key: string, params?: Record<string, string | number>) => string): string {
  if (!backup) {
    return t('sync_no_farmer_profile');
  }

  const parts: string[] = [];
  const { plotResult, queueResult, plotsRestored, receiptsRestored, evidenceRestored, declarationsRestored } = backup;
  const restoredPlots = plotsRestored ?? 0;
  const restoredReceipts = receiptsRestored ?? 0;
  const restoredEvidence = evidenceRestored ?? 0;
  const restoredDeclarations = declarationsRestored ?? 0;

  if (restoredEvidence > 0) {
    parts.push(t('sync_result_evidence_restored', { n: restoredEvidence }));
  }
  if (restoredDeclarations > 0) {
    parts.push(t('sync_result_declarations_restored', { n: restoredDeclarations }));
  }

  if (restoredPlots > 0 && restoredReceipts > 0) {
    parts.push(
      t('sync_result_plots_and_receipts_restored', {
        plots: restoredPlots,
        receipts: restoredReceipts,
      }),
    );
  } else {
    if (restoredReceipts > 0) {
      parts.push(t('sync_result_receipts_restored', { n: restoredReceipts }));
    }
    if (restoredPlots > 0) {
      parts.push(t('sync_result_plots_restored', { n: restoredPlots }));
    }
  }

  if (plotResult?.fetchFailed) {
    parts.push(t('sync_plots_fetch_failed'));
  } else if (plotResult?.stoppedForAuth) {
    parts.push(t('sync_session_expired_short'));
  } else if (plotResult && plotResult.uploaded > 0) {
    if (plotResult.failed > 0) {
      parts.push(
        t('sign_in_backup_partial', {
          uploaded: plotResult.uploaded,
          failed: plotResult.failed,
        }),
      );
    } else if (plotResult.unsyncedBefore > 0 && plotResult.uploaded === plotResult.unsyncedBefore) {
      parts.push(
        t('sync_plots_uploaded_all', {
          uploaded: plotResult.uploaded,
          total: plotResult.unsyncedBefore,
        }),
      );
    } else {
      parts.push(t('sign_in_backup_done', { n: plotResult.uploaded }));
    }
  } else if (plotResult && plotResult.failed > 0) {
    parts.push(
      t('sign_in_backup_partial', {
        uploaded: plotResult.uploaded,
        failed: plotResult.failed,
      }),
    );
  } else if (plotResult && plotResult.unsyncedBefore === 0 && (plotsRestored ?? 0) === 0) {
    parts.push(t('sync_plots_already_synced'));
  }

  if (queueResult.fetchFailed) {
    parts.push(t('sync_queue_fetch_failed'));
  } else {
    if (queueResult.completed > 0) {
      parts.push(t('sync_queue_sent', { n: queueResult.completed }));
    }
    if (queueResult.failedActions > 0) {
      parts.push(t('sync_queue_failed_remain', { n: queueResult.failedActions }));
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : t('backup_up_to_date');
}

export type SignInVariant = 'general' | 'after_plot' | 'sync';

type OpenSignInOptions = {
  variant?: SignInVariant;
  onSuccess?: () => void | Promise<void>;
};

type SignInSheetContextValue = {
  openSignIn: (options?: OpenSignInOptions) => void;
  openCreateAccount: () => Promise<void>;
  closeSignIn: () => void;
  isSignedIn: boolean;
  refreshAuth: () => Promise<void>;
  /** Clear sync credentials on this device and update global auth state. */
  signOutOnDevice: () => Promise<void>;
  /** Ask farmer to consent before cloud backup; runs callback after confirm or if already consented. */
  promptBackupConsent: (onConfirmed?: () => void | Promise<void>) => Promise<void>;
};

const SignInSheetContext = createContext<SignInSheetContextValue | undefined>(undefined);

export function SignInProvider({ children }: { children: ReactNode }) {
  const { farmer, plots, setFarmer, reloadFromDisk } = useAppState();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const authSheetStyles = useThemedStyles(createAuthSheetStyles);

  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<SignInVariant>('general');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [emailMode, setEmailMode] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [createWizardVisible, setCreateWizardVisible] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupPlotCount, setBackupPlotCount] = useState(0);
  const onSuccessRef = useRef<(() => void | Promise<void>) | undefined>(undefined);
  const backupConfirmedCallbackRef = useRef<(() => void | Promise<void>) | undefined>(undefined);
  const oauthSignInInFlightRef = useRef(false);
  const refreshAuthInFlightRef = useRef<Promise<void> | null>(null);

  const countUnsyncedPlots = useCallback(async (): Promise<number> => {
    if (!farmer?.id || plots.length === 0) return 0;
    try {
      const backend = await fetchPlotsForFarmer(farmer.id);
      return listUnsyncedLocalPlots(plots, backend ?? []).length;
    } catch {
      return plots.length;
    }
  }, [farmer?.id, plots]);

  const showBackupOutcomeAlert = useCallback(
    (backup: RunAutoBackupResult | null) => {
      Alert.alert(t('backup_consent_title'), buildBackupOutcomeMessage(backup, t));
    },
    [t],
  );

  const reloadAfterAccountSwitch = useCallback(async () => {
    await reloadFromDisk();
  }, [reloadFromDisk]);

  const offerBackupAfterAuth = useCallback(async () => {
    const diskState = await loadAppState().catch(() => ({ farmer, plots }));
    const activeFarmer = diskState.farmer ?? farmer;
    const activePlots = diskState.plots ?? plots;
    if (!activeFarmer?.id) return;

    const { farmer: alignedFarmer, rekeyed } = await alignFarmerWithAuthUser(activeFarmer, {
      localPlots: activePlots,
    });
    const scopedFarmer = alignedFarmer ?? activeFarmer;
    if (!scopedFarmer?.id) return;

    let scopedPlots = activePlots;
    if (rekeyed) {
      setFarmer(scopedFarmer);
      await reloadFromDisk();
      scopedPlots = (await loadAppState().catch(() => ({ plots: scopedPlots }))).plots;
    }

    let unsynced = 0;
    if (scopedPlots.length > 0) {
      try {
        const backend = await fetchPlotsForFarmer(scopedFarmer.id);
        unsynced = listUnsyncedLocalPlots(scopedPlots, backend ?? []).length;
      } catch {
        unsynced = scopedPlots.length;
      }
    }

    const pendingQueue = await loadPendingSyncActions().catch(() => []);
    const localReceiptRows = await loadLocalDeliveryReceiptsForFarmer(scopedFarmer.id).catch(
      () => [],
    );
    const serverPlotCount =
      scopedPlots.length === 0
        ? await countServerPlotsForPostAuthRestore({
            profileFarmerId: scopedFarmer.id,
            localPlots: scopedPlots,
          })
        : null;
    const serverVoucherCount =
      localReceiptRows.length === 0
        ? await countServerVouchersForPostAuthRestore({
            profileFarmerId: scopedFarmer.id,
            localPlots: scopedPlots,
          })
        : null;

    const offerInput = {
      localPlotCount: scopedPlots.length,
      unsyncedPlotCount: unsynced,
      pendingQueueCount: pendingQueue.length,
      serverPlotCount,
      localReceiptCount: localReceiptRows.length,
      serverVoucherCount,
    };
    if (!shouldOfferPostAuthSync(offerInput)) return;

    const plotCountHint = postAuthSyncPlotCountHint(offerInput);

    if ((await hasDataProcessingConsent()) && scopedFarmer.id) {
      const backup = await runAutoBackup({
        farmerId: scopedFarmer.id,
        localPlots: scopedPlots,
      });
      await reloadFromDisk();
      showBackupOutcomeAlert(backup);
      return;
    }
    if (backupBusy) return;
    setBackupPlotCount(plotCountHint);
    setBackupModalVisible(true);
  }, [backupBusy, farmer, plots, reloadFromDisk, setFarmer, showBackupOutcomeAlert]);

  const promptBackupConsent = useCallback(
    async (onConfirmed?: () => void | Promise<void>) => {
      if (await hasDataProcessingConsent()) {
        if (onConfirmed) await onConfirmed();
        return;
      }
      const unsynced = await countUnsyncedPlots();
      backupConfirmedCallbackRef.current = onConfirmed;
      if (backupBusy) return;
      setBackupPlotCount(unsynced || plots.length);
      setBackupModalVisible(true);
    },
    [backupBusy, countUnsyncedPlots, plots.length],
  );

  const handleBackupConfirm = useCallback(async () => {
    if (backupBusy) return;

    setBackupBusy(true);
    try {
      const { farmer: alignedFarmer, rekeyed } = await alignFarmerWithAuthUser(farmer, {
        localPlots: plots,
      });
      if (rekeyed && alignedFarmer) {
        setFarmer(alignedFarmer);
        await reloadFromDisk();
      }
      const farmerId = alignedFarmer?.id ?? farmer?.id;
      if (!farmerId) {
        Alert.alert(t('backup_consent_title'), t('sync_no_farmer_profile'));
        return;
      }

      const backup = await runBackupWithConsent({ farmerId, localPlots: plots });
      await reloadFromDisk();
      showBackupOutcomeAlert(backup);
      const cb = backupConfirmedCallbackRef.current;
      backupConfirmedCallbackRef.current = undefined;
      if (cb) await cb();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert(t('backup_consent_title'), message || t('backend_unreachable'));
    } finally {
      setBackupModalVisible(false);
      setBackupBusy(false);
    }
  }, [backupBusy, farmer, plots, reloadFromDisk, setFarmer, showBackupOutcomeAlert, t]);

  const handleBackupDecline = useCallback(() => {
    trackEvent(ANALYTICS_EVENTS.BACKUP_DECLINED, { plotCount: backupPlotCount });
    backupConfirmedCallbackRef.current = undefined;
    setBackupModalVisible(false);
  }, [backupPlotCount]);

  const syncLocalFarmerFromAuth = useCallback(
    async (nameHint?: string, options?: { preferDisk?: boolean }) => {
      let baseFarmer = farmer;
      let basePlots = plots;
      if (options?.preferDisk) {
        const diskState = await loadAppState().catch(() => null);
        if (diskState) {
          baseFarmer = diskState.farmer;
          basePlots = diskState.plots;
        }
      }

      const { email: authEmail } = getAuthCredentials();
      const authUserId = await getAuthenticatedSupabaseUserId().catch(() => null);
      const next = bootstrapFarmerProfile(baseFarmer, {
        name: nameHint,
        email: authEmail ?? undefined,
        preferredId: authUserId ?? undefined,
      });
      const candidate = shouldUpdateBootstrappedFarmer(baseFarmer, next) ? next : baseFarmer;
      const { farmer: aligned, rekeyed } = await alignFarmerWithAuthUser(candidate, {
        localPlots: basePlots,
      });
      if (!aligned) return;
      const adopted = await adoptOnDeviceFarmerScope(aligned.id).catch(() => false);
      if (rekeyed || adopted || shouldUpdateBootstrappedFarmer(baseFarmer, aligned)) {
        setFarmer(aligned);
        if (rekeyed || adopted) {
          await reloadFromDisk();
        }
      }
    },
    [farmer, plots, setFarmer, reloadFromDisk],
  );

  const handlePostAuthSyncOffer = useCallback(
    async (accountSwitch?: AccountSwitchResolution) => {
      if (!accountSwitch?.clearedStaleLocalData) {
        void offerBackupAfterAuth();
        return;
      }

      const diskState = await loadAppState().catch(() => ({ farmer: undefined, plots: [] }));
      const activeFarmer = diskState.farmer ?? farmer;
      if (!activeFarmer?.id) return;

      const hasCloudData = await accountHasCloudFieldData(activeFarmer.id, diskState.plots);
      if (!hasCloudData) {
        return;
      }

      let unsynced = 0;
      try {
        const backend = await fetchPlotsForFarmer(activeFarmer.id);
        unsynced = listUnsyncedLocalPlots(diskState.plots, backend ?? []).length;
      } catch {
        unsynced = diskState.plots.length;
      }

      const pendingQueue = await loadPendingSyncActions().catch(() => []);
      const localReceiptRows = await loadLocalDeliveryReceiptsForFarmer(activeFarmer.id).catch(
        () => [],
      );
      const serverPlotCount = await countServerPlotsForPostAuthRestore({
        profileFarmerId: activeFarmer.id,
        localPlots: diskState.plots,
      });
      const serverVoucherCount = await countServerVouchersForPostAuthRestore({
        profileFarmerId: activeFarmer.id,
        localPlots: diskState.plots,
      });
      const plotCountHint = postAuthSyncPlotCountHint({
        localPlotCount: diskState.plots.length,
        unsyncedPlotCount: unsynced,
        pendingQueueCount: pendingQueue.length,
        serverPlotCount,
        localReceiptCount: localReceiptRows.length,
        serverVoucherCount,
      });

      if ((await hasDataProcessingConsent()) && activeFarmer.id) {
        const backup = await runAutoBackup({
          farmerId: activeFarmer.id,
          localPlots: diskState.plots,
        });
        await reloadFromDisk();
        showBackupOutcomeAlert(backup);
        return;
      }
      if (backupBusy) return;
      setBackupPlotCount(plotCountHint);
      setBackupModalVisible(true);
    },
    [backupBusy, farmer, offerBackupAfterAuth, reloadFromDisk, showBackupOutcomeAlert],
  );

  const adoptHydratedAuthSession = useCallback(async (): Promise<boolean> => {
    await hydrateSyncAuthFromSettings();
    if (!hasSyncAuthSession()) {
      setIsSignedIn(false);
      setEmail('');
      return false;
    }
    const { email: savedEmail } = getAuthCredentials();
    if (savedEmail) setEmail(savedEmail);
    setIsSignedIn(true);
    try {
      await syncLocalFarmerFromAuth(undefined, { preferDisk: true });
    } catch {
      // Credentials are on device; farmer alignment is best-effort on refresh.
    }
    return true;
  }, [syncLocalFarmerFromAuth]);

  const refreshAuth = useCallback(async () => {
    if (oauthSignInInFlightRef.current) {
      return;
    }
    if (refreshAuthInFlightRef.current) {
      await refreshAuthInFlightRef.current;
      return;
    }

    const run = (async () => {
      const generationAtStart = getAuthUiGeneration();
      await hydrateSyncAuthFromSettings();
      if (oauthSignInInFlightRef.current) {
        return;
      }
      if (!hasSyncAuthSession()) {
        setIsSignedIn(false);
        setEmail('');
        return;
      }
      if (generationAtStart !== getAuthUiGeneration()) {
        await adoptHydratedAuthSession();
        return;
      }

      const { email: savedEmail } = getAuthCredentials();
      if (savedEmail) setEmail(savedEmail);
      setIsSignedIn(true);

      const access = await verifySyncAccessToken();
      if (oauthSignInInFlightRef.current) {
        return;
      }
      if (generationAtStart !== getAuthUiGeneration()) {
        await adoptHydratedAuthSession();
        return;
      }
      if (!hasSyncAuthSession()) {
        setIsSignedIn(false);
        setEmail('');
        return;
      }
      if (!access.ok && access.reason === 'session_expired') {
        setIsSignedIn(false);
        setEmail('');
        return;
      }
      try {
        await syncLocalFarmerFromAuth(undefined, { preferDisk: true });
      } catch {
        // Credentials are on device; farmer alignment is best-effort on refresh.
      }
    })();

    refreshAuthInFlightRef.current = run;
    try {
      await run;
    } finally {
      if (refreshAuthInFlightRef.current === run) {
        refreshAuthInFlightRef.current = null;
      }
    }
  }, [adoptHydratedAuthSession, syncLocalFarmerFromAuth]);

  useEffect(() => {
    const sub = Linking.addEventListener('url', (event) => {
      if (!isOAuthCallbackUrl(event.url)) return;
      if (deliverOAuthCallbackUrl(event.url)) return;

      void (async () => {
        try {
          await hydrateSyncAuthFromSettings();
          if (hasSyncAuthSession()) {
            const { email: signedInEmail } = getAuthCredentials();
            if (signedInEmail) setEmail(signedInEmail);
            setIsSignedIn(true);
            void syncLocalFarmerFromAuth(undefined, { preferDisk: true });
            return;
          }

          const session = await sessionFromOAuthCallbackUrl(event.url);
          const result = await completeOAuthFarmerSession({
            session,
            farmerId: farmer?.id,
            localPlots: plots,
          });
          if (!result.ok || !hasSyncAuthSession()) return;
          trackEvent(ANALYTICS_EVENTS.SIGN_IN_SUCCESS, { method: 'oauth', source: 'deep_link' });
          const { email: signedInEmail } = getAuthCredentials();
          if (signedInEmail) setEmail(signedInEmail);
          setIsSignedIn(true);
          if (result.accountSwitch?.clearedStaleLocalData) {
            await reloadAfterAccountSwitch();
          }
          await syncLocalFarmerFromAuth(undefined, { preferDisk: true });
          void handlePostAuthSyncOffer(result.accountSwitch);
          if (result.apiUnreachable) {
            Alert.alert(t('sign_in'), t('sign_in_api_unreachable'));
          }
        } catch {
          // Deep-link handler is best-effort when no in-app OAuth waiter is active.
        }
      })();
    });
    return () => sub.remove();
  }, [farmer?.id, handlePostAuthSyncOffer, plots, reloadAfterAccountSwitch, syncLocalFarmerFromAuth, t]);

  useEffect(() => {
    if (shouldUseMaestroCiThinBoot()) {
      setAuthReady(true);
      return;
    }
    void refreshAuth().finally(() => setAuthReady(true));
  }, [refreshAuth]);

  const dismissWelcome = useCallback(async () => {
    setWelcomeVisible(false);
    await setSetting(ACCOUNT_WELCOME_DISMISSED_KEY, '1');
  }, []);

  useEffect(() => {
    if (!authReady || isSignedIn) return;
    if (shouldUseMaestroCiThinBoot()) return;
    void (async () => {
      const dismissed = await getSetting(ACCOUNT_WELCOME_DISMISSED_KEY);
      if (dismissed !== '1') {
        setWelcomeVisible(true);
      }
    })();
  }, [authReady, isSignedIn]);

  const openCreateAccount = useCallback(async () => {
    await dismissWelcome();
    setCreateWizardVisible(true);
  }, [dismissWelcome]);

  const showSignUpSuccess = (accountSwitch?: AccountSwitchResolution) => {
    setIsSignedIn(true);
    Alert.alert(t('farmer_signup_success_title'), t('farmer_signup_success_body'));
    void handlePostAuthSyncOffer(accountSwitch);
  };

  const closeSignIn = useCallback(() => {
    setVisible(false);
    setHint(null);
    setPassword('');
    setEmailMode(false);
    onSuccessRef.current = undefined;
  }, []);

  const signOutOnDevice = useCallback(async () => {
    abortSyncAuthForSignOut();
    const { email: signedOutEmail } = getAuthCredentials();
    if (signedOutEmail?.trim()) {
      await rememberLastAuthenticatedEmail(signedOutEmail);
    }
    setIsSignedIn(false);
    setEmail('');
    setPassword('');
    setHint(null);
    setVisible(false);
    setEmailMode(false);
    onSuccessRef.current = undefined;
    await unregisterFarmerPushToken().catch(() => undefined);
    clearFieldProducerBootstrapCache();
    await clearPersistedSyncAuth();
  }, []);

  const openSignIn = useCallback((options?: OpenSignInOptions) => {
    setVariant(options?.variant ?? 'general');
    onSuccessRef.current = options?.onSuccess;
    setHint(null);
    setPassword('');
    setEmailMode(false);
    setVisible(true);
  }, []);

  /** iPad: close welcome before presenting sign-in — two Modals in one frame fails silently. */
  const openSignInFromWelcome = useCallback(async () => {
    await dismissWelcome();
    await new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => resolve());
    });
    openSignIn({ variant: 'general' });
  }, [dismissWelcome, openSignIn]);

  const titleKey =
    variant === 'after_plot'
      ? 'plot_saved_sign_in_title'
      : variant === 'sync'
        ? 'sign_in_to_sync_title'
        : 'sign_in_to_tracebud_title';

  const bodyKey =
    variant === 'after_plot'
      ? 'plot_saved_sign_in_body'
      : variant === 'sync'
        ? 'sign_in_to_sync_body'
        : 'sign_in_oauth_sub';

  const finishSuccessfulSignIn = async (options?: { accountSwitch?: AccountSwitchResolution }) => {
    if (!hasSyncAuthSession()) {
      setIsSignedIn(false);
      return;
    }
    setIsSignedIn(true);
    setPassword('');
    if (options?.accountSwitch?.clearedStaleLocalData) {
      await reloadAfterAccountSwitch();
    }
    await syncLocalFarmerFromAuth(undefined, { preferDisk: true });
    closeSignIn();
    const onSuccess = onSuccessRef.current;
    if (onSuccess) {
      void Promise.resolve(onSuccess());
    }
    void handlePostAuthSyncOffer(options?.accountSwitch);
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    oauthSignInInFlightRef.current = true;
    setOauthLoading(provider);
    setHint(null);
    trackEvent(ANALYTICS_EVENTS.OAUTH_SIGN_IN_STARTED, { provider, source: 'in_app' });
    try {
      const result = await signInWithOAuthAndSyncPlots({
        provider,
        farmerId: farmer?.id,
        localPlots: plots,
      });
      if (!result.ok) {
        if (await adoptHydratedAuthSession()) {
          trackEvent(ANALYTICS_EVENTS.SIGN_IN_SUCCESS, {
            method: provider,
            source: 'in_app_recovered',
          });
          await finishSuccessfulSignIn();
          return;
        }
        setIsSignedIn(false);
        if (__DEV__ && result.message && !result.message.startsWith('sign_in_')) {
          Alert.alert(t('sign_in'), result.message);
        }
        if (
          result.message === 'sign_in_oauth_needs_signup' ||
          result.message === 'sign_in_oauth_failed' ||
          result.message === 'sign_in_oauth_provider_disabled' ||
          result.message === 'sign_in_field_bootstrap_failed' ||
          result.message === 'sign_in_api_unreachable' ||
          result.message === 'sign_in_dashboard_account'
        ) {
          closeSignIn();
          showOAuthSignInFailureAlert(t, result.message, () => {
            if (
              result.message !== 'sign_in_field_bootstrap_failed' &&
              result.message !== 'sign_in_api_unreachable' &&
              result.message !== 'sign_in_dashboard_account'
            ) {
              void openCreateAccount();
            }
          });
          return;
        }
        const message =
          result.message === 'sign_in_oauth_cancelled'
            ? t('sign_in_oauth_cancelled')
            : formatSignInErrorMessage(t, result.message);
        setHint(message);
        trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
          method: provider,
          source: 'in_app',
          reason: normalizeAuthAnalyticsReason(result.message),
        });
        return;
      }
      trackEvent(ANALYTICS_EVENTS.SIGN_IN_SUCCESS, { method: provider, source: 'in_app' });
      if (!(await adoptHydratedAuthSession())) {
        setHint(t('sign_in_oauth_failed'));
        trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
          method: provider,
          source: 'in_app',
          reason: 'session_not_persisted',
        });
        return;
      }
      setOauthLoading(null);
      await finishSuccessfulSignIn({ accountSwitch: result.accountSwitch });
      if (result.apiUnreachable) {
        Alert.alert(t('sign_in'), t('sign_in_api_unreachable'));
      }
    } catch (e) {
      if (await adoptHydratedAuthSession()) {
        trackEvent(ANALYTICS_EVENTS.SIGN_IN_SUCCESS, {
          method: provider,
          source: 'in_app_recovered',
        });
        await finishSuccessfulSignIn();
        return;
      }
      const message = formatSignInErrorMessage(t, e instanceof Error ? e.message : String(e));
      setHint(message);
      setIsSignedIn(false);
      trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
        method: provider,
        source: 'in_app',
        reason: 'exception',
      });
    } finally {
      oauthSignInInFlightRef.current = false;
      setOauthLoading(null);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setHint(null);
    try {
      const result = await signInAndSyncPlots({
        email,
        password,
        farmerId: farmer?.id,
        localPlots: plots,
      });
      if (!result.ok) {
        let message = formatSignInErrorMessage(t, result.message);
        if (variant === 'after_plot' && result.message === 'sign_in_invalid_credentials') {
          message = `${message} ${t('plot_still_on_device')}`;
        }
        setHint(message);
        setIsSignedIn(false);
        trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
          method: 'password',
          reason: normalizeAuthAnalyticsReason(result.message),
        });
        return;
      }
      trackEvent(ANALYTICS_EVENTS.SIGN_IN_SUCCESS, { method: 'password' });
      await finishSuccessfulSignIn({ accountSwitch: result.accountSwitch });
    } catch (e) {
      const message = formatSignInErrorMessage(t, e instanceof Error ? e.message : String(e));
      setHint(message);
      setIsSignedIn(false);
      trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
        method: 'password',
        reason: 'exception',
      });
    } finally {
      setLoading(false);
    }
  };

  const signInSheetContextValue = useMemo(
    () => ({
      openSignIn,
      openCreateAccount,
      closeSignIn,
      isSignedIn,
      refreshAuth,
      signOutOnDevice,
      promptBackupConsent,
    }),
    [
      openSignIn,
      openCreateAccount,
      closeSignIn,
      isSignedIn,
      refreshAuth,
      signOutOnDevice,
      promptBackupConsent,
    ],
  );

  return (
    <SignInSheetContext.Provider value={signInSheetContextValue}>
      {children}
      <WelcomeAccountModal
        visible={welcomeVisible}
        title={t('welcome_account_title')}
        body={t('welcome_account_body')}
        createAccountLabel={t('create_account')}
        signInLabel={t('sign_in')}
        skipLabel={t('welcome_account_skip')}
        onCreateAccount={() => void openCreateAccount()}
        onSignIn={() => void openSignInFromWelcome()}
        onSkip={() => void dismissWelcome()}
      />
      <CreateAccountWizard
        visible={createWizardVisible}
        farmerId={farmer?.id}
        localPlots={plots}
        onClose={() => setCreateWizardVisible(false)}
        onSuccess={({ accountSwitch } = {}) => {
          setCreateWizardVisible(false);
          void refreshAuth()
            .then(async () => {
              if (accountSwitch?.clearedStaleLocalData) {
                await reloadAfterAccountSwitch();
              }
              await syncLocalFarmerFromAuth(undefined, { preferDisk: true });
            })
            .then(() => {
              showSignUpSuccess(accountSwitch);
            })
            .catch(() => undefined);
        }}
        onSignInInstead={() => {
          setCreateWizardVisible(false);
          void (async () => {
            await new Promise<void>((resolve) => {
              InteractionManager.runAfterInteractions(() => resolve());
            });
            openSignIn({ variant: 'general' });
          })();
        }}
      />
      <BackupConsentModal
        visible={backupModalVisible}
        busy={backupBusy}
        title={t('backup_consent_title')}
        body={t('backup_consent_body', { n: backupPlotCount })}
        consentLabel={t('backup_consent_confirm')}
        declineLabel={t('backup_consent_decline')}
        onConfirm={() => void handleBackupConfirm()}
        onDecline={handleBackupDecline}
      />
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={closeSignIn}
      >
        <KeyboardAvoidingView
          style={authSheetStyles.keyboardRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <View
            style={[authSheetStyles.backdrop, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}
          >
            <Pressable
              style={authSheetStyles.backdropPress}
              accessibilityRole="button"
              accessibilityLabel={t('sign_in_skip')}
              onPress={closeSignIn}
            />
            <AuthSheetScrollCard styles={authSheetStyles}>
              <View style={authSheetStyles.headerRow}>
                {emailMode ? (
                  <Pressable
                    onPress={() => {
                      setEmailMode(false);
                      setHint(null);
                    }}
                    hitSlop={12}
                    style={authSheetStyles.closeBtn}
                  >
                    <Ionicons name="chevron-back" size={22} color={colors.iconMuted} />
                  </Pressable>
                ) : null}
                <ThemedText type="defaultSemiBold" style={authSheetStyles.title}>
                  {emailMode ? t('sign_in_with_email_title') : t(titleKey)}
                </ThemedText>
                <Pressable onPress={closeSignIn} hitSlop={12} style={authSheetStyles.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.iconMuted} />
                </Pressable>
              </View>
              {!emailMode ? (
                <ThemedText type="caption" style={authSheetStyles.subtitle}>
                  {t(bodyKey)}
                </ThemedText>
              ) : null}
              {!emailMode ? (
                <>
                  <OAuthProviderButtons
                    disabled={loading}
                    loadingProvider={oauthLoading}
                    busyLabel={t('sign_in_oauth_busy')}
                    googleLabel={t('sign_in_with_google')}
                    appleLabel={t('sign_in_with_apple')}
                    onGoogle={() => void handleOAuthSignIn('google')}
                    onApple={() => void handleOAuthSignIn('apple')}
                  />
                  <Pressable
                    onPress={() => {
                      setHint(null);
                      setEmailMode(true);
                    }}
                    style={authSheetStyles.textLink}
                    disabled={loading || oauthLoading !== null}
                  >
                    <ThemedText type="defaultSemiBold" style={authSheetStyles.textLinkLabel}>
                      {t('sign_in_use_email')}
                    </ThemedText>
                  </Pressable>
                </>
              ) : (
                <>
                  <Input
                    label={t('label_email')}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    placeholder="you@example.com"
                    dense
                  />
                  <Input
                    label={t('label_password')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    showPasswordA11yLabel={t('password_show_a11y')}
                    hidePasswordA11yLabel={t('password_hide_a11y')}
                    placeholder="••••••••"
                    dense
                  />
                  {hint ? (
                    <ThemedText type="caption" style={authSheetStyles.hint}>
                      {hint}
                    </ThemedText>
                  ) : null}
                  {loading || oauthLoading ? (
                    <ActivityIndicator color={Brand.primary} style={{ marginVertical: Spacing.xs }} />
                  ) : (
                    <Button variant="primary" size="sm" fullWidth onPress={() => void handleSignIn()}>
                      {t('sign_in')}
                    </Button>
                  )}
                </>
              )}
              {!emailMode ? (
                <View style={authSheetStyles.footerRow}>
                  <Pressable
                    onPress={() => {
                      closeSignIn();
                      void openCreateAccount();
                    }}
                    style={authSheetStyles.footerLink}
                  >
                    <ThemedText type="defaultSemiBold" style={authSheetStyles.footerLinkText}>
                      {t('create_account')}
                    </ThemedText>
                  </Pressable>
                  <ThemedText style={authSheetStyles.footerDot}>·</ThemedText>
                  <Pressable onPress={closeSignIn} style={authSheetStyles.footerLink}>
                    <ThemedText type="defaultSemiBold" style={authSheetStyles.footerMutedText}>
                      {t('sign_in_skip')}
                    </ThemedText>
                  </Pressable>
                </View>
              ) : null}
            </AuthSheetScrollCard>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SignInSheetContext.Provider>
  );
}

export function useSignInSheet(): SignInSheetContextValue {
  const ctx = useContext(SignInSheetContext);
  if (!ctx) {
    throw new Error('useSignInSheet must be used within SignInProvider');
  }
  return ctx;
}

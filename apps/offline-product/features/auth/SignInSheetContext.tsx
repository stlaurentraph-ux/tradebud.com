import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { BackupConsentModal } from '@/components/auth/BackupConsentModal';
import { CreateAccountWizard } from '@/components/auth/CreateAccountWizard';
import { OAuthProviderButtons } from '@/components/auth/OAuthProviderButtons';
import { authSheetStyles } from '@/components/auth/authSheetStyles';
import { WelcomeAccountModal } from '@/components/auth/WelcomeAccountModal';
import { fetchPlotsForFarmer } from '@/features/api/postPlot';
import { clearFieldProducerBootstrapCache } from '@/features/api/fieldAppBootstrap';
import { showOAuthSignInFailureAlert } from '@/features/auth/oauthSignInAlerts';
import { isOAuthCallbackUrl, sessionFromOAuthCallbackUrl } from '@/features/auth/oauthCallbackUrl';
import { deliverOAuthCallbackUrl } from '@/features/auth/oauthCallbackBridge';
import { completeOAuthFarmerSession } from '@/features/auth/completeOAuthFarmerSession';
import { alignFarmerWithAuthUser } from '@/features/auth/alignFarmerWithAuthUser';
import {
  bootstrapFarmerProfile,
  shouldUpdateBootstrappedFarmer,
} from '@/features/auth/farmerProfileBootstrap';
import { getAuthenticatedSupabaseUserId } from '@/features/api/syncAuthSession';
import { formatSignInErrorMessage } from '@/features/auth/mapAuthError';
import { signInAndSyncPlots, signInWithOAuthAndSyncPlots } from '@/features/auth/signInSync';
import { hasDataProcessingConsent } from '@/features/compliance/dataProcessingConsent';
import { runBackupWithConsent } from '@/features/sync/backupWithConsent';
import { runAutoBackup, type RunAutoBackupResult } from '@/features/sync/runAutoBackup';
import {
  listUnsyncedLocalPlots,
} from '@/features/sync/plotServerSync';
import type { OAuthProvider } from '@/features/auth/oauthSignIn';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { getSetting, loadPendingSyncActions, setSetting, adoptOnDeviceFarmerScope } from '@/features/state/persistence';
import { unregisterFarmerPushToken } from '@/features/notifications/registerFarmerPushToken';

const ACCOUNT_WELCOME_DISMISSED_KEY = 'account_welcome_dismissed';

function buildBackupOutcomeMessage(backup: RunAutoBackupResult | null, t: (key: string, params?: Record<string, string | number>) => string): string {
  if (!backup) {
    return t('sync_no_farmer_profile');
  }

  const parts: string[] = [];
  const { plotResult, queueResult } = backup;

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
  } else if (plotResult && plotResult.unsyncedBefore === 0) {
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

  const offerBackupAfterAuth = useCallback(async () => {
    const unsynced = await countUnsyncedPlots();
    const pendingQueue = await loadPendingSyncActions().catch(() => []);
    if (unsynced <= 0 && pendingQueue.length === 0) return;
    if ((await hasDataProcessingConsent()) && farmer?.id) {
      const backup = await runAutoBackup({ farmerId: farmer.id, localPlots: plots });
      showBackupOutcomeAlert(backup);
      return;
    }
    if (backupBusy) return;
    setBackupPlotCount(unsynced || plots.length || pendingQueue.length);
    setBackupModalVisible(true);
  }, [backupBusy, countUnsyncedPlots, farmer?.id, plots, showBackupOutcomeAlert]);

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
    async (nameHint?: string) => {
      const { email: authEmail } = getAuthCredentials();
      const authUserId = await getAuthenticatedSupabaseUserId().catch(() => null);
      const next = bootstrapFarmerProfile(farmer, {
        name: nameHint,
        email: authEmail ?? undefined,
        preferredId: authUserId ?? undefined,
      });
      const candidate = shouldUpdateBootstrappedFarmer(farmer, next) ? next : farmer;
      const { farmer: aligned, rekeyed } = await alignFarmerWithAuthUser(candidate, {
        localPlots: plots,
      });
      if (!aligned) return;
      const adopted = await adoptOnDeviceFarmerScope(aligned.id).catch(() => false);
      if (rekeyed || adopted || shouldUpdateBootstrappedFarmer(farmer, aligned)) {
        setFarmer(aligned);
        if (rekeyed || adopted) {
          await reloadFromDisk();
        }
      }
    },
    [farmer, plots, setFarmer, reloadFromDisk],
  );

  const refreshAuth = useCallback(async () => {
    const generationAtStart = getAuthUiGeneration();
    await hydrateSyncAuthFromSettings();
    if (generationAtStart !== getAuthUiGeneration() || !hasSyncAuthSession()) {
      setIsSignedIn(false);
      setEmail('');
      return;
    }
    const { email: savedEmail } = getAuthCredentials();
    if (savedEmail) setEmail(savedEmail);
    setIsSignedIn(true);

    const access = await verifySyncAccessToken();
    if (generationAtStart !== getAuthUiGeneration() || !hasSyncAuthSession()) {
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
      await syncLocalFarmerFromAuth();
    } catch {
      // Credentials are on device; farmer alignment is best-effort on refresh.
    }
  }, [syncLocalFarmerFromAuth]);

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
            void syncLocalFarmerFromAuth();
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
          void syncLocalFarmerFromAuth();
          if (result.apiUnreachable) {
            Alert.alert(t('sign_in'), t('sign_in_api_unreachable'));
          }
        } catch {
          // Deep-link handler is best-effort when no in-app OAuth waiter is active.
        }
      })();
    });
    return () => sub.remove();
  }, [farmer?.id, plots, syncLocalFarmerFromAuth, t]);

  useEffect(() => {
    void refreshAuth().finally(() => setAuthReady(true));
  }, [refreshAuth]);

  const dismissWelcome = useCallback(async () => {
    await setSetting(ACCOUNT_WELCOME_DISMISSED_KEY, '1');
    setWelcomeVisible(false);
  }, []);

  useEffect(() => {
    if (!authReady || isSignedIn) return;
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

  const showSignUpSuccess = () => {
    setIsSignedIn(true);
    Alert.alert(t('farmer_signup_success_title'), t('farmer_signup_success_body'));
    void offerBackupAfterAuth();
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

  const openSignIn = useCallback(
    (options?: OpenSignInOptions) => {
      setVariant(options?.variant ?? 'general');
      onSuccessRef.current = options?.onSuccess;
      setHint(null);
      setPassword('');
      setEmailMode(false);
      void refreshAuth();
      setVisible(true);
    },
    [refreshAuth],
  );

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

  const finishSuccessfulSignIn = async () => {
    if (!hasSyncAuthSession()) {
      setIsSignedIn(false);
      return;
    }
    setIsSignedIn(true);
    setPassword('');
    await syncLocalFarmerFromAuth();
    closeSignIn();
    const onSuccess = onSuccessRef.current;
    if (onSuccess) {
      void Promise.resolve(onSuccess());
    }
    void offerBackupAfterAuth();
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
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
        await hydrateSyncAuthFromSettings();
        if (hasSyncAuthSession()) {
          const { email: signedInEmail } = getAuthCredentials();
          if (signedInEmail) setEmail(signedInEmail);
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
          result.message === 'sign_in_api_unreachable'
        ) {
          closeSignIn();
          showOAuthSignInFailureAlert(t, result.message, () => {
            if (
              result.message !== 'sign_in_field_bootstrap_failed' &&
              result.message !== 'sign_in_api_unreachable'
            ) {
              void openCreateAccount();
            }
          });
          return;
        }
        const message =
          result.message === 'sign_in_oauth_cancelled'
            ? t('sign_in_oauth_cancelled')
            : result.message;
        setHint(message);
        trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
          method: provider,
          source: 'in_app',
          reason: result.message,
        });
        return;
      }
      trackEvent(ANALYTICS_EVENTS.SIGN_IN_SUCCESS, { method: provider, source: 'in_app' });
      if (!hasSyncAuthSession()) {
        setIsSignedIn(false);
        setHint(t('sign_in_oauth_failed'));
        trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
          method: provider,
          source: 'in_app',
          reason: 'session_not_persisted',
        });
        return;
      }
      const { email: signedInEmail } = getAuthCredentials();
      if (signedInEmail) setEmail(signedInEmail);
      setOauthLoading(null);
      await finishSuccessfulSignIn();
      if (result.apiUnreachable) {
        Alert.alert(t('sign_in'), t('sign_in_api_unreachable'));
      }
    } catch (e) {
      const message = formatSignInErrorMessage(t, e instanceof Error ? e.message : String(e));
      setHint(message);
      setIsSignedIn(false);
      trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
        method: provider,
        source: 'in_app',
        reason: 'exception',
        message,
      });
    } finally {
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
          reason: result.message,
        });
        return;
      }
      trackEvent(ANALYTICS_EVENTS.SIGN_IN_SUCCESS, { method: 'password' });
      await finishSuccessfulSignIn();
    } catch (e) {
      const message = formatSignInErrorMessage(t, e instanceof Error ? e.message : String(e));
      setHint(message);
      setIsSignedIn(false);
      trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
        method: 'password',
        reason: 'exception',
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInSheetContext.Provider
      value={{
        openSignIn,
        openCreateAccount,
        closeSignIn,
        isSignedIn,
        refreshAuth,
        signOutOnDevice,
        promptBackupConsent,
      }}
    >
      {children}
      <WelcomeAccountModal
        visible={welcomeVisible}
        title={t('welcome_account_title')}
        body={t('welcome_account_body')}
        createAccountLabel={t('create_account')}
        signInLabel={t('sign_in')}
        skipLabel={t('welcome_account_skip')}
        onCreateAccount={() => void openCreateAccount()}
        onSignIn={() => {
          void dismissWelcome();
          openSignIn({ variant: 'general' });
        }}
        onSkip={() => void dismissWelcome()}
      />
      <CreateAccountWizard
        visible={createWizardVisible}
        farmerId={farmer?.id}
        localPlots={plots}
        onClose={() => setCreateWizardVisible(false)}
        onSuccess={() => {
          setCreateWizardVisible(false);
          showSignUpSuccess();
          void refreshAuth()
            .then(() => syncLocalFarmerFromAuth())
            .catch(() => undefined);
        }}
        onSignInInstead={() => openSignIn({ variant: 'general' })}
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
            <View style={authSheetStyles.card}>
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
                    <Ionicons name="chevron-back" size={22} color="#6B7280" />
                  </Pressable>
                ) : null}
                <ThemedText type="defaultSemiBold" style={authSheetStyles.title}>
                  {emailMode ? t('sign_in_with_email_title') : t(titleKey)}
                </ThemedText>
                <Pressable onPress={closeSignIn} hitSlop={12} style={authSheetStyles.closeBtn}>
                  <Ionicons name="close" size={20} color="#6B7280" />
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
            </View>
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

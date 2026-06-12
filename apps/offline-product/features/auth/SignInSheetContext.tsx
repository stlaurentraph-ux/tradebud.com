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
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import {
  clearPersistedSyncAuth,
  getAuthCredentials,
  hasSyncAuthSession,
  hydrateSyncAuthFromSettings,
  testBackendLogin,
} from '@/features/api/postPlot';
import { BackupConsentModal } from '@/components/auth/BackupConsentModal';
import { CreateAccountWizard } from '@/components/auth/CreateAccountWizard';
import { WelcomeAccountModal } from '@/components/auth/WelcomeAccountModal';
import { fetchPlotsForFarmer } from '@/features/api/postPlot';
import { showOAuthSignInFailureAlert } from '@/features/auth/oauthSignInAlerts';
import { alignFarmerWithAuthUser } from '@/features/auth/alignFarmerWithAuthUser';
import {
  bootstrapFarmerProfile,
  shouldUpdateBootstrappedFarmer,
} from '@/features/auth/farmerProfileBootstrap';
import { getAuthenticatedSupabaseUserId } from '@/features/api/syncAuthSession';
import { signInAndSyncPlots, signInWithOAuthAndSyncPlots } from '@/features/auth/signInSync';
import { hasDataProcessingConsent } from '@/features/compliance/dataProcessingConsent';
import { runBackupWithConsent } from '@/features/sync/backupWithConsent';
import {
  listUnsyncedLocalPlots,
  uploadUnsyncedPlotsForFarmer,
  type UploadUnsyncedPlotsResult,
} from '@/features/sync/plotServerSync';
import type { OAuthProvider } from '@/features/auth/oauthSignIn';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { getSetting, setSetting } from '@/features/state/persistence';

const ACCOUNT_WELCOME_DISMISSED_KEY = 'account_welcome_dismissed';

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
  /** Ask farmer to consent before cloud backup; runs callback after confirm or if already consented. */
  promptBackupConsent: (onConfirmed?: () => void | Promise<void>) => Promise<void>;
};

const SignInSheetContext = createContext<SignInSheetContextValue | undefined>(undefined);

export function SignInProvider({ children }: { children: ReactNode }) {
  const { farmer, plots, setFarmer, reloadAppState } = useAppState();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<SignInVariant>('general');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
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

  const showBackupResultAlert = useCallback(
    (sync: UploadUnsyncedPlotsResult | null) => {
      if (sync && sync.uploaded > 0 && sync.failed === 0) {
        Alert.alert(t('sign_in_to_backup_title'), t('sign_in_backup_done', { n: sync.uploaded }));
      } else if (sync && (sync.failed > 0 || sync.fetchFailed)) {
        Alert.alert(
          t('sign_in_to_backup_title'),
          sync.fetchFailed
            ? t('backend_unreachable')
            : t('sign_in_backup_partial', { uploaded: sync.uploaded, failed: sync.failed }),
        );
      }
    },
    [t],
  );

  const offerBackupAfterAuth = useCallback(async () => {
    const unsynced = await countUnsyncedPlots();
    if (unsynced <= 0) return;
    if ((await hasDataProcessingConsent()) && farmer?.id) {
      const sync = await uploadUnsyncedPlotsForFarmer({ farmerId: farmer.id, localPlots: plots });
      showBackupResultAlert(sync);
      return;
    }
    setBackupPlotCount(unsynced);
    setBackupModalVisible(true);
  }, [countUnsyncedPlots, farmer?.id, plots, showBackupResultAlert]);

  const promptBackupConsent = useCallback(
    async (onConfirmed?: () => void | Promise<void>) => {
      if (await hasDataProcessingConsent()) {
        if (onConfirmed) await onConfirmed();
        return;
      }
      const unsynced = await countUnsyncedPlots();
      backupConfirmedCallbackRef.current = onConfirmed;
      setBackupPlotCount(unsynced || plots.length);
      setBackupModalVisible(true);
    },
    [countUnsyncedPlots, plots.length],
  );

  const handleBackupConfirm = useCallback(async () => {
    if (!farmer?.id) {
      setBackupModalVisible(false);
      return;
    }
    setBackupBusy(true);
    try {
      const sync = await runBackupWithConsent({ farmerId: farmer.id, localPlots: plots });
      setBackupModalVisible(false);
      showBackupResultAlert(sync);
      const cb = backupConfirmedCallbackRef.current;
      backupConfirmedCallbackRef.current = undefined;
      if (cb) await cb();
    } finally {
      setBackupBusy(false);
    }
  }, [farmer?.id, plots, showBackupResultAlert]);

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
      if (rekeyed || shouldUpdateBootstrappedFarmer(farmer, aligned)) {
        setFarmer(aligned);
        if (rekeyed) {
          await reloadAppState();
        }
      }
    },
    [farmer, plots, setFarmer, reloadAppState],
  );

  const refreshAuth = useCallback(async () => {
    await hydrateSyncAuthFromSettings();
    const { email: savedEmail } = getAuthCredentials();
    if (savedEmail) setEmail(savedEmail);
    if (!hasSyncAuthSession()) {
      setIsSignedIn(false);
      return;
    }
    const res = await testBackendLogin();
    if (!res.ok) {
      await clearPersistedSyncAuth();
      setIsSignedIn(false);
      setEmail('');
      return;
    }
    setIsSignedIn(true);
    await syncLocalFarmerFromAuth();
  }, [syncLocalFarmerFromAuth]);

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
    onSuccessRef.current = undefined;
  }, []);

  const openSignIn = useCallback(
    (options?: OpenSignInOptions) => {
      setVariant(options?.variant ?? 'general');
      onSuccessRef.current = options?.onSuccess;
      setHint(null);
      setPassword('');
      void refreshAuth();
      setVisible(true);
    },
    [refreshAuth],
  );

  const titleKey =
    variant === 'after_plot' ? 'plot_saved_sign_in_title' : 'sign_in_to_backup_title';

  const bodyKey =
    variant === 'after_plot'
      ? 'plot_saved_sign_in_body'
      : variant === 'sync'
        ? 'sign_in_to_backup_body'
        : 'sign_in_sub';

  const finishSuccessfulSignIn = async (
    sync: import('@/features/sync/plotServerSync').UploadUnsyncedPlotsResult | null,
  ) => {
    setIsSignedIn(true);
    setPassword('');
    await syncLocalFarmerFromAuth();
    const onSuccess = onSuccessRef.current;
    closeSignIn();
    if (onSuccess) await onSuccess();
    void offerBackupAfterAuth();
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    setHint(null);
    try {
      const result = await signInWithOAuthAndSyncPlots({
        provider,
        farmerId: farmer?.id,
        localPlots: plots,
      });
      if (!result.ok) {
        setIsSignedIn(false);
        if (
          result.message === 'sign_in_oauth_needs_signup' ||
          result.message === 'sign_in_oauth_failed'
        ) {
          closeSignIn();
          showOAuthSignInFailureAlert(t, result.message, () => {
            void openCreateAccount();
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
          reason: result.message,
        });
        return;
      }
      trackEvent(ANALYTICS_EVENTS.SIGN_IN_SUCCESS, { method: provider });
      const { email: signedInEmail } = getAuthCredentials();
      if (signedInEmail) setEmail(signedInEmail);
      await finishSuccessfulSignIn(result.sync);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setHint(message);
      setIsSignedIn(false);
      trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
        method: provider,
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
        let message =
          result.message === 'enter_email_password'
            ? t('enter_email_password')
            : result.message === 'sign_in_invalid_credentials'
              ? t('sign_in_invalid_credentials')
              : result.message;
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
      await finishSuccessfulSignIn(result.sync);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
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
          void refreshAuth().then(async () => {
            await syncLocalFarmerFromAuth();
            showSignUpSuccess();
          });
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
      <Modal visible={visible} transparent animationType="fade" onRequestClose={closeSignIn}>
        <KeyboardAvoidingView
          style={styles.keyboardRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <Pressable
            style={[styles.backdrop, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
            onPress={closeSignIn}
          >
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              automaticallyAdjustKeyboardInsets
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
            <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
              <View style={styles.headerRow}>
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={variant === 'after_plot' ? 'checkmark-circle' : 'log-in-outline'}
                    size={26}
                    color={Brand.primary}
                  />
                </View>
                <Pressable onPress={closeSignIn} hitSlop={12} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </Pressable>
              </View>
              <ThemedText type="title" style={styles.title}>
                {t(titleKey)}
              </ThemedText>
              <ThemedText type="default" style={styles.body}>
                {t(bodyKey)}
              </ThemedText>
              <View style={styles.oauthRow}>
                <Button
                  variant="outline"
                  fullWidth
                  disabled={loading || oauthLoading !== null}
                  onPress={() => void handleOAuthSignIn('google')}
                >
                  {oauthLoading === 'google' ? t('sign_in_oauth_busy') : t('sign_in_with_google')}
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  disabled={loading || oauthLoading !== null}
                  onPress={() => void handleOAuthSignIn('apple')}
                >
                  {oauthLoading === 'apple' ? t('sign_in_oauth_busy') : t('sign_in_with_apple')}
                </Button>
              </View>
              <ThemedText type="caption" style={styles.oauthDivider}>
                {t('sign_in_or_email')}
              </ThemedText>
              <Input
                label={t('label_email')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@example.com"
                containerStyle={styles.input}
              />
              <Input
                label={t('label_password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                containerStyle={styles.input}
              />
              {hint ? (
                <ThemedText type="caption" style={styles.hint}>
                  {hint}
                </ThemedText>
              ) : null}
              {loading || oauthLoading ? (
                <ActivityIndicator color={Brand.primary} style={{ marginVertical: Spacing.sm }} />
              ) : (
                <Button variant="primary" fullWidth onPress={() => void handleSignIn()}>
                  {t('sign_in')}
                </Button>
              )}
              <Pressable
                onPress={() => {
                  closeSignIn();
                  void openCreateAccount();
                }}
                style={styles.secondaryLinkBtn}
              >
                <ThemedText type="defaultSemiBold" style={styles.secondaryLinkText}>
                  {t('create_account')}
                </ThemedText>
              </Pressable>
              <Pressable onPress={closeSignIn} style={styles.skipBtn}>
                <ThemedText type="defaultSemiBold" style={styles.skipText}>
                  {t('sign_in_skip')}
                </ThemedText>
              </Pressable>
            </Pressable>
            </ScrollView>
          </Pressable>
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

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
  },
  scroll: {
    flexGrow: 0,
    maxHeight: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingTop: Spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 20,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: '#E6F7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    color: '#0B4F3B',
  },
  body: {
    color: '#4B5563',
    lineHeight: 22,
  },
  oauthRow: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  oauthDivider: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginVertical: Spacing.xs,
  },
  input: {
    marginTop: 4,
  },
  hint: {
    color: Brand.warning,
  },
  secondaryLinkBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  secondaryLinkText: {
    color: Brand.primary,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: '#6B7280',
  },
});

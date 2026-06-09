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
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import {
  getAuthCredentials,
  hydrateSyncAuthFromSettings,
} from '@/features/api/postPlot';
import { signInAndSyncPlots } from '@/features/auth/signInSync';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';

export type SignInVariant = 'general' | 'after_plot' | 'sync';

type OpenSignInOptions = {
  variant?: SignInVariant;
  onSuccess?: () => void | Promise<void>;
};

type SignInSheetContextValue = {
  openSignIn: (options?: OpenSignInOptions) => void;
  closeSignIn: () => void;
  isSignedIn: boolean;
  refreshAuth: () => Promise<void>;
};

const SignInSheetContext = createContext<SignInSheetContextValue | undefined>(undefined);

export function SignInProvider({ children }: { children: ReactNode }) {
  const { farmer, plots } = useAppState();
  const { t } = useLanguage();

  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<SignInVariant>('general');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const onSuccessRef = useRef<(() => void | Promise<void>) | undefined>(undefined);

  const refreshAuth = useCallback(async () => {
    await hydrateSyncAuthFromSettings();
    const { email: savedEmail, password: savedPassword } = getAuthCredentials();
    if (savedEmail) setEmail(savedEmail);
    setIsSignedIn(Boolean(savedEmail?.trim() && savedPassword));
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

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
    variant === 'after_plot'
      ? 'plot_saved_sign_in_title'
      : variant === 'sync'
        ? 'sign_in_to_sync_title'
        : 'sign_in_sync_plots';

  const bodyKey =
    variant === 'after_plot'
      ? 'plot_saved_sign_in_body'
      : variant === 'sync'
        ? 'sign_in_to_sync_body'
        : 'sign_in_sub';

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
        const message =
          result.message === 'enter_email_password' ? t('enter_email_password') : result.message;
        setHint(message);
        setIsSignedIn(false);
        return;
      }
      setIsSignedIn(true);
      setPassword('');
      const onSuccess = onSuccessRef.current;
      closeSignIn();
      if (onSuccess) await onSuccess();
    } catch (e) {
      setHint(e instanceof Error ? e.message : String(e));
      setIsSignedIn(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInSheetContext.Provider value={{ openSignIn, closeSignIn, isSignedIn, refreshAuth }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={closeSignIn}>
        <KeyboardAvoidingView
          style={styles.keyboardRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.backdrop} onPress={closeSignIn}>
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
              {loading ? (
                <ActivityIndicator color={Brand.primary} style={{ marginVertical: Spacing.sm }} />
              ) : (
                <Button variant="primary" fullWidth onPress={() => void handleSignIn()}>
                  {t('sign_in')}
                </Button>
              )}
              <Pressable onPress={closeSignIn} style={styles.skipBtn}>
                <ThemedText type="defaultSemiBold" style={styles.skipText}>
                  {t('sign_in_skip')}
                </ThemedText>
              </Pressable>
            </Pressable>
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
    padding: 16,
    paddingBottom: 28,
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
  input: {
    marginTop: 4,
  },
  hint: {
    color: Brand.warning,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: '#6B7280',
  },
});

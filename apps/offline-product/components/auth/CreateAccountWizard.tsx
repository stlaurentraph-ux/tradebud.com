import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { resolveFarmerDisplayName } from '@/features/auth/farmerProfileBootstrap';
import { ensureFarmerOAuthProfile } from '@/features/auth/oauthSession';
import {
  signUpWithEmailAndSyncPlots,
  signUpWithOAuthAndSyncPlots,
} from '@/features/auth/farmerSignUp';
import type { OAuthProvider } from '@/features/auth/oauthSignIn';
import type { Plot } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import type { UploadUnsyncedPlotsResult } from '@/features/sync/plotServerSync';

type WizardStep = 'method' | 'email' | 'name';

type CreateAccountWizardProps = {
  visible: boolean;
  farmerId?: string;
  localPlots?: Plot[];
  onClose: () => void;
  onSuccess: (sync: UploadUnsyncedPlotsResult | null) => void;
  onSignInInstead: () => void;
};

export function CreateAccountWizard({
  visible,
  farmerId,
  localPlots,
  onClose,
  onSuccess,
  onSignInInstead,
}: CreateAccountWizardProps) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<WizardStep>('method');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null);
  const [pendingSync, setPendingSync] = useState<UploadUnsyncedPlotsResult | null>(null);

  const reset = useCallback(() => {
    setStep('method');
    setFullName('');
    setEmail('');
    setPassword('');
    setHint(null);
    setBusy(false);
    setOauthBusy(null);
    setPendingSync(null);
  }, []);

  useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [visible, reset]);

  const resolveMessage = (code: string): string => {
    if (code === 'enter_email_password') return t('enter_email_password');
    if (code === 'farmer_signup_name_required') return t('farmer_signup_name_required');
    if (code === 'farmer_signup_confirm_email') return t('farmer_signup_confirm_email');
    if (code === 'sign_in_oauth_cancelled') return t('sign_in_oauth_cancelled');
    if (code === 'sign_in_oauth_needs_signup') return t('sign_in_oauth_needs_signup');
    if (code === 'sign_in_apple_not_completed') return t('sign_in_apple_not_completed');
    if (code === 'sign_in_oauth_failed') return t('sign_in_oauth_failed');
    return code;
  };

  const finishSuccess = (sync: UploadUnsyncedPlotsResult | null) => {
    onClose();
    onSuccess(sync);
  };

  const handleEmailSignUp = async () => {
    setBusy(true);
    setHint(null);
    const resolvedName = resolveFarmerDisplayName({ fullName, email }) ?? '';
    try {
      const result = await signUpWithEmailAndSyncPlots({
        fullName: resolvedName,
        email,
        password,
        farmerId,
        localPlots,
      });
      if (!result.ok) {
        setHint(resolveMessage(result.message));
        return;
      }
      finishSuccess(result.sync);
    } catch (e) {
      setHint(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleOAuthSignUp = async (provider: OAuthProvider) => {
    setOauthBusy(provider);
    setHint(null);
    try {
      const result = await signUpWithOAuthAndSyncPlots({
        provider,
        fullName: '',
        farmerId,
        localPlots,
      });
      if (!result.ok) {
        setHint(resolveMessage(result.message));
        return;
      }
      if (result.missingName) {
        setPendingSync(result.sync);
        setStep('name');
        return;
      }
      finishSuccess(result.sync);
    } catch (e) {
      setHint(e instanceof Error ? e.message : String(e));
    } finally {
      setOauthBusy(null);
    }
  };

  const handleSaveNameAfterOAuth = async () => {
    if (!fullName.trim()) {
      setHint(t('farmer_signup_name_required'));
      return;
    }
    setBusy(true);
    setHint(null);
    try {
      await ensureFarmerOAuthProfile(fullName.trim());
      finishSuccess(pendingSync);
    } catch (e) {
      setHint(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const stepNumber = step === 'method' ? 1 : 2;
  const stepLabelKey =
    step === 'method'
      ? 'farmer_signup_step_account'
      : step === 'email'
        ? 'farmer_signup_step_email'
        : 'farmer_signup_step_you';

  const canSubmitEmail = email.trim().length > 0 && password.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <Pressable
          style={[styles.backdrop, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
          onPress={onClose}
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
                <View style={styles.progressRow}>
                  <View style={[styles.progressDot, stepNumber >= 1 ? styles.progressDotActive : null]} />
                  <View
                    style={[styles.progressLine, stepNumber >= 2 ? styles.progressLineActive : null]}
                  />
                  <View style={[styles.progressDot, stepNumber >= 2 ? styles.progressDotActive : null]} />
                </View>
                <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </Pressable>
              </View>
              <ThemedText type="caption" style={styles.stepLabel}>
                {t(stepLabelKey)}
              </ThemedText>

              <Image
                source={require('../../assets/images/tracebud-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />

              {step === 'method' ? (
                <>
                  <ThemedText type="title" style={styles.title}>
                    {t('farmer_signup_intro_title')}
                  </ThemedText>
                  <ThemedText type="default" style={styles.body}>
                    {t('farmer_signup_method_body')}
                  </ThemedText>
                  <View style={styles.oauthRow}>
                    <Button
                      variant="outline"
                      fullWidth
                      disabled={busy || oauthBusy !== null}
                      onPress={() => void handleOAuthSignUp('google')}
                    >
                      {oauthBusy === 'google' ? t('sign_in_oauth_busy') : t('sign_in_with_google')}
                    </Button>
                    <Button
                      variant="outline"
                      fullWidth
                      disabled={busy || oauthBusy !== null}
                      onPress={() => void handleOAuthSignUp('apple')}
                    >
                      {oauthBusy === 'apple' ? t('sign_in_oauth_busy') : t('sign_in_with_apple')}
                    </Button>
                  </View>
                  <ThemedText type="caption" style={styles.oauthDivider}>
                    {t('sign_in_or_email')}
                  </ThemedText>
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={busy || oauthBusy !== null}
                    onPress={() => {
                      setHint(null);
                      setStep('email');
                    }}
                  >
                    {t('farmer_signup_use_email')}
                  </Button>
                </>
              ) : null}

              {step === 'email' ? (
                <>
                  <ThemedText type="title" style={styles.title}>
                    {t('farmer_signup_email_title')}
                  </ThemedText>
                  <ThemedText type="default" style={styles.body}>
                    {t('farmer_signup_email_body')}
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
                  <Input
                    label={t('farmer_signup_name_label')}
                    value={fullName}
                    onChangeText={setFullName}
                    autoComplete="name"
                    placeholder={t('farmer_signup_name_placeholder')}
                    containerStyle={styles.input}
                  />
                  <ThemedText type="caption" style={styles.nameHint}>
                    {t('farmer_signup_name_optional_hint')}
                  </ThemedText>
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={busy || !canSubmitEmail}
                    onPress={() => void handleEmailSignUp()}
                  >
                    {busy ? t('sign_in_oauth_busy') : t('create_account')}
                  </Button>
                  <Pressable
                    onPress={() => {
                      setHint(null);
                      setStep('method');
                    }}
                    style={styles.backBtn}
                  >
                    <ThemedText type="defaultSemiBold" style={styles.backText}>
                      {t('farmer_signup_back')}
                    </ThemedText>
                  </Pressable>
                </>
              ) : null}

              {step === 'name' ? (
                <>
                  <ThemedText type="title" style={styles.title}>
                    {t('farmer_signup_name_after_oauth_title')}
                  </ThemedText>
                  <ThemedText type="default" style={styles.body}>
                    {t('farmer_signup_name_after_oauth_body')}
                  </ThemedText>
                  <Input
                    label={t('farmer_signup_name_label')}
                    value={fullName}
                    onChangeText={setFullName}
                    autoComplete="name"
                    placeholder={t('farmer_signup_name_placeholder')}
                    containerStyle={styles.input}
                  />
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={busy || !fullName.trim()}
                    onPress={() => void handleSaveNameAfterOAuth()}
                  >
                    {busy ? t('sign_in_oauth_busy') : t('walk_continue')}
                  </Button>
                </>
              ) : null}

              {hint ? (
                <ThemedText type="caption" style={styles.hint}>
                  {hint}
                </ThemedText>
              ) : null}
              {(busy || oauthBusy) && !hint ? (
                <ActivityIndicator color={Brand.primary} style={{ marginVertical: Spacing.sm }} />
              ) : null}

              {step === 'method' ? (
                <Pressable
                  onPress={() => {
                    onClose();
                    onSignInInstead();
                  }}
                  style={styles.signInLink}
                >
                  <ThemedText type="defaultSemiBold" style={styles.signInLinkText}>
                    {t('farmer_signup_already_have')}
                  </ThemedText>
                </Pressable>
              ) : null}
            </Pressable>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
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
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1D5DB',
  },
  progressDotActive: {
    backgroundColor: Brand.primary,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
  },
  progressLineActive: {
    backgroundColor: Brand.primary,
  },
  closeBtn: {
    padding: 4,
  },
  stepLabel: {
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 11,
  },
  logo: {
    width: 48,
    height: 48,
    alignSelf: 'center',
    marginVertical: Spacing.xs,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    color: '#0B4F3B',
    textAlign: 'center',
  },
  body: {
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  input: {
    marginTop: 4,
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
  hint: {
    color: Brand.warning,
    textAlign: 'center',
  },
  nameHint: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: -4,
    marginBottom: Spacing.xs,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  backText: {
    color: '#6B7280',
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: Spacing.xs,
  },
  signInLinkText: {
    color: Brand.primary,
  },
});

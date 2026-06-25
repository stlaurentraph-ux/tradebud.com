import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { OAuthProviderButtons } from '@/components/auth/OAuthProviderButtons';
import { AuthMethodOrDivider } from '@/components/auth/AuthMethodOrDivider';
import { createAuthSheetStyles } from '@/components/auth/authSheetStyles';
import { Brand, Spacing } from '@/constants/theme';
import { formatSignInErrorMessage } from '@/features/auth/mapAuthError';
import { resolveFarmerDisplayName } from '@/features/auth/farmerProfileBootstrap';
import { ensureFarmerOAuthProfile } from '@/features/auth/oauthSession';
import {
  hasSyncAuthSession,
  hydrateSyncAuthFromSettings,
} from '@/features/api/syncAuthSession';
import {
  signUpWithEmailAndSyncPlots,
  signUpWithOAuthAndSyncPlots,
} from '@/features/auth/farmerSignUp';
import type { OAuthProvider } from '@/features/auth/oauthSignIn';
import type { Plot } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';

type WizardStep = 'method' | 'email' | 'name';

type CreateAccountWizardProps = {
  visible: boolean;
  farmerId?: string;
  localPlots?: Plot[];
  onClose: () => void;
  onSuccess: (options?: { existingAccount?: boolean }) => void;
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
  const colors = useAppColors();
  const authSheetStyles = useThemedStyles(createAuthSheetStyles);
  const [step, setStep] = useState<WizardStep>('method');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null);
  const [pendingExistingAccount, setPendingExistingAccount] = useState(false);
  const oauthInFlightRef = useRef(false);

  const reset = useCallback(() => {
    setStep('method');
    setFullName('');
    setEmail('');
    setPassword('');
    setHint(null);
    setBusy(false);
    setOauthBusy(null);
    setPendingExistingAccount(false);
  }, []);

  useEffect(() => {
    if (!visible && !oauthInFlightRef.current) {
      reset();
    }
  }, [visible, reset]);

  const resolveMessage = (code: string): string => {
    if (code === 'farmer_signup_name_required') return t('farmer_signup_name_required');
    if (code === 'farmer_signup_confirm_email') return t('farmer_signup_confirm_email');
    if (code === 'sign_in_oauth_cancelled') return t('sign_in_oauth_cancelled');
    if (code === 'sign_in_oauth_needs_signup') return t('sign_in_oauth_needs_signup');
    if (code === 'sign_in_dashboard_account') return t('sign_in_dashboard_account');
    if (code === 'sign_in_apple_not_completed') return t('sign_in_apple_not_completed');
    if (code === 'sign_in_oauth_failed') return t('sign_in_oauth_failed');
    return formatSignInErrorMessage(t, code);
  };

  const finishSuccess = (options?: { existingAccount?: boolean }) => {
    onClose();
    onSuccess(options);
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
      finishSuccess();
    } catch (e) {
      setHint(formatSignInErrorMessage(t, e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  const handleOAuthSignUp = async (provider: OAuthProvider) => {
    oauthInFlightRef.current = true;
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
        await hydrateSyncAuthFromSettings().catch(() => undefined);
        if (hasSyncAuthSession()) {
          finishSuccess({ existingAccount: true });
          return;
        }
        setHint(resolveMessage(result.message));
        return;
      }
      if (result.missingName) {
        if (result.existingAccount) {
          finishSuccess({ existingAccount: true });
          return;
        }
        setOauthBusy(null);
        setPendingExistingAccount(false);
        setStep('name');
        return;
      }
      finishSuccess({ existingAccount: result.existingAccount });
    } catch (e) {
      await hydrateSyncAuthFromSettings().catch(() => undefined);
      if (hasSyncAuthSession()) {
        finishSuccess({ existingAccount: true });
        return;
      }
      setHint(formatSignInErrorMessage(t, e instanceof Error ? e.message : String(e)));
    } finally {
      oauthInFlightRef.current = false;
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
      await ensureFarmerOAuthProfile(fullName.trim()).catch(() => undefined);
      await hydrateSyncAuthFromSettings().catch(() => undefined);
      if (!hasSyncAuthSession()) {
        setHint(t('sign_in_oauth_failed'));
        return;
      }
      finishSuccess({ existingAccount: pendingExistingAccount });
    } catch (e) {
      await hydrateSyncAuthFromSettings().catch(() => undefined);
      if (hasSyncAuthSession()) {
        finishSuccess({ existingAccount: pendingExistingAccount });
        return;
      }
      setHint(formatSignInErrorMessage(t, e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  const stepLabelKey =
    step === 'method'
      ? 'farmer_signup_step_account'
      : step === 'email'
        ? 'farmer_signup_step_email'
        : 'farmer_signup_step_you';

  const titleKey =
    step === 'method'
      ? 'farmer_signup_intro_title'
      : step === 'email'
        ? 'farmer_signup_email_title'
        : 'farmer_signup_name_after_oauth_title';

  const canSubmitEmail = email.trim().length > 0 && password.length > 0;
  const showBack = step === 'email' || step === 'name';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
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
            accessibilityLabel={t('cancel')}
            onPress={onClose}
          />
          <View style={authSheetStyles.card}>
            <View style={authSheetStyles.headerRow}>
              {showBack ? (
                <Pressable
                  onPress={() => {
                    setHint(null);
                    setStep('method');
                  }}
                  hitSlop={12}
                  style={authSheetStyles.closeBtn}
                >
                  <Ionicons name="chevron-back" size={22} color={colors.iconMuted} />
                </Pressable>
              ) : null}
              <ThemedText type="defaultSemiBold" style={authSheetStyles.title}>
                {t(titleKey)}
              </ThemedText>
              <Pressable onPress={onClose} hitSlop={12} style={authSheetStyles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.iconMuted} />
              </Pressable>
            </View>
            <ThemedText type="caption" style={authSheetStyles.subtitle}>
              {t(stepLabelKey)}
            </ThemedText>

            {step === 'method' ? (
              <>
                <OAuthProviderButtons
                  disabled={busy}
                  loadingProvider={oauthBusy}
                  busyLabel={t('sign_in_oauth_busy')}
                  googleLabel={t('sign_in_with_google')}
                  appleLabel={t('sign_in_with_apple')}
                  onGoogle={() => void handleOAuthSignUp('google')}
                  onApple={() => void handleOAuthSignUp('apple')}
                />
                <AuthMethodOrDivider label={t('auth_method_or')} />
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  testID="create-account-use-email"
                  disabled={busy || oauthBusy !== null}
                  icon={<Ionicons name="mail-outline" size={18} color={colors.tint} />}
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
                  showPasswordToggle
                  showPasswordAccessibilityLabel={t('show_password')}
                  hidePasswordAccessibilityLabel={t('hide_password')}
                  placeholder="••••••••"
                  dense
                />
                <Input
                  label={t('farmer_signup_name_label')}
                  value={fullName}
                  onChangeText={setFullName}
                  autoComplete="name"
                  placeholder={t('farmer_signup_name_placeholder')}
                  dense
                />
                <ThemedText type="caption" style={authSheetStyles.subtitle}>
                  {t('farmer_signup_name_optional_hint')}
                </ThemedText>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  disabled={busy || !canSubmitEmail}
                  onPress={() => void handleEmailSignUp()}
                >
                  {busy ? t('sign_in_oauth_busy') : t('create_account')}
                </Button>
              </>
            ) : null}

            {step === 'name' ? (
              <>
                <ThemedText type="caption" style={authSheetStyles.subtitle}>
                  {t('farmer_signup_name_after_oauth_body')}
                </ThemedText>
                <Input
                  label={t('farmer_signup_name_label')}
                  value={fullName}
                  onChangeText={setFullName}
                  autoComplete="name"
                  placeholder={t('farmer_signup_name_placeholder')}
                  dense
                />
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  disabled={busy || !fullName.trim()}
                  onPress={() => void handleSaveNameAfterOAuth()}
                >
                  {busy ? t('sign_in_oauth_busy') : t('walk_continue')}
                </Button>
              </>
            ) : null}

            {hint ? (
              <ThemedText type="caption" style={authSheetStyles.hint}>
                {hint}
              </ThemedText>
            ) : null}
            {(busy || oauthBusy) && !hint ? (
              <ActivityIndicator color={Brand.primary} style={{ marginVertical: Spacing.xs }} />
            ) : null}

            {step === 'method' ? (
              <View style={authSheetStyles.footerRow}>
                <Pressable
                  onPress={() => {
                    onClose();
                    onSignInInstead();
                  }}
                  style={authSheetStyles.footerLink}
                >
                  <ThemedText type="defaultSemiBold" style={authSheetStyles.footerLinkText}>
                    {t('sign_in')}
                  </ThemedText>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

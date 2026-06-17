import { useCallback, useEffect, useState } from 'react';
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
import { authSheetStyles } from '@/components/auth/authSheetStyles';
import { Brand, Spacing } from '@/constants/theme';
import { formatSignInErrorMessage } from '@/features/auth/mapAuthError';
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

  const reset = useCallback(() => {
    setStep('method');
    setFullName('');
    setEmail('');
    setPassword('');
    setHint(null);
    setBusy(false);
    setOauthBusy(null);
  }, []);

  useEffect(() => {
    if (!visible) {
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
      finishSuccess(null);
    } catch (e) {
      setHint(formatSignInErrorMessage(t, e instanceof Error ? e.message : String(e)));
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
        setOauthBusy(null);
        setStep('name');
        return;
      }
      setOauthBusy(null);
      finishSuccess(null);
    } catch (e) {
      setHint(formatSignInErrorMessage(t, e instanceof Error ? e.message : String(e)));
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
      finishSuccess(null);
    } catch (e) {
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={authSheetStyles.keyboardRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <Pressable
          style={[authSheetStyles.backdrop, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}
          onPress={onClose}
        >
          <Pressable style={authSheetStyles.card} onPress={(e) => e.stopPropagation()}>
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
                  <Ionicons name="chevron-back" size={22} color="#6B7280" />
                </Pressable>
              ) : null}
              <ThemedText type="defaultSemiBold" style={authSheetStyles.title}>
                {t(titleKey)}
              </ThemedText>
              <Pressable onPress={onClose} hitSlop={12} style={authSheetStyles.closeBtn}>
                <Ionicons name="close" size={20} color="#6B7280" />
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
                  googleLabel={t('oauth_google_short')}
                  appleLabel={t('oauth_apple_short')}
                  onGoogle={() => void handleOAuthSignUp('google')}
                  onApple={() => void handleOAuthSignUp('apple')}
                />
                <Pressable
                  onPress={() => {
                    setHint(null);
                    setStep('email');
                  }}
                  style={authSheetStyles.textLink}
                  disabled={busy || oauthBusy !== null}
                >
                  <ThemedText type="defaultSemiBold" style={authSheetStyles.textLinkLabel}>
                    {t('farmer_signup_use_email')}
                  </ThemedText>
                </Pressable>
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
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

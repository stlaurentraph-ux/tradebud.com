import { useEffect, useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brand } from '@/constants/theme';
import {
  getLinkedOAuthProviders,
  hasStoredPasswordCredential,
  setAccountPasswordForCurrentUser,
  shouldOfferChangePassword,
  shouldOfferSetPassword,
  validateAccountPassword,
  type OAuthProviderLabel,
} from '@/features/auth/accountPassword';
import { formatSignInErrorMessage } from '@/features/auth/mapAuthError';
import {
  getSyncAuthMethod,
  getSyncAuthUser,
  hydrateSyncAuthFromSettings,
} from '@/features/api/syncAuthSession';
import type { TranslateFn } from '@/features/i18n/translate';

type SetPasswordCardProps = {
  signedIn: boolean;
  t: TranslateFn;
  onPasswordSaved?: () => void;
};

function providerListLabel(providers: OAuthProviderLabel[], t: TranslateFn): string {
  if (providers.length === 0) {
    return t('settings_password_oauth_providers_fallback');
  }
  if (providers.length === 2) {
    return t('settings_password_oauth_providers_both');
  }
  if (providers[0] === 'google') {
    return t('oauth_google_short');
  }
  return t('oauth_apple_short');
}

export function SetPasswordCard({ signedIn, t, onPasswordSaved }: SetPasswordCardProps) {
  const [loading, setLoading] = useState(true);
  const [offerSet, setOfferSet] = useState(false);
  const [offerChange, setOfferChange] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<OAuthProviderLabel[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!signedIn) {
      setOfferSet(false);
      setOfferChange(false);
      setOauthProviders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const hasPasswordCredential = await hasStoredPasswordCredential();
      if (hasPasswordCredential && getSyncAuthMethod() !== 'password') {
        await hydrateSyncAuthFromSettings();
      }
      const user = await getSyncAuthUser();
      const method = getSyncAuthMethod();
      setOauthProviders(getLinkedOAuthProviders(user));
      setOfferSet(
        shouldOfferSetPassword({
          signedIn: true,
          authMethod: method,
          user,
          hasPasswordCredential,
        }),
      );
      setOfferChange(
        shouldOfferChangePassword({
          signedIn: true,
          user,
          authMethod: method,
          hasPasswordCredential,
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [signedIn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mode = offerSet ? 'set' : offerChange ? 'change' : null;
  const providerLabel = useMemo(() => providerListLabel(oauthProviders, t), [oauthProviders, t]);

  const resetModal = () => {
    setModalOpen(false);
    setPassword('');
    setConfirm('');
    setMessage(null);
  };

  const closeModal = () => {
    if (busy) return;
    resetModal();
  };

  const submit = async () => {
    const validationCode = validateAccountPassword(password, confirm);
    if (validationCode) {
      setMessage(formatSignInErrorMessage(t, validationCode));
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await setAccountPasswordForCurrentUser(password);
      if (!result.ok) {
        setMessage(formatSignInErrorMessage(t, result.message));
        return;
      }
      resetModal();
      setOfferSet(false);
      setOfferChange(true);
      onPasswordSaved?.();
      await refresh();
    } catch (e) {
      setMessage(
        formatSignInErrorMessage(t, e instanceof Error ? e.message : 'sign_in_failed'),
      );
    } finally {
      setBusy(false);
    }
  };

  if (!signedIn || loading || !mode) {
    return null;
  }

  return (
    <>
      <View style={styles.wrap}>
        {mode === 'change' ? (
          <>
            <ThemedText type="defaultSemiBold" style={styles.statusTitle}>
              {t('settings_password_set_status')}
            </ThemedText>
            <ThemedText type="caption" style={styles.body}>
              {t('settings_password_change_body')}
            </ThemedText>
          </>
        ) : (
          <ThemedText type="caption" style={styles.body}>
            {t('settings_password_set_body', { providers: providerLabel })}
          </ThemedText>
        )}
        <Pressable
          onPress={() => {
            setMessage(null);
            setModalOpen(true);
          }}
          hitSlop={8}
        >
          <ThemedText type="caption" style={styles.link}>
            {mode === 'set' ? t('settings_password_set_action') : t('settings_password_change_action')}
          </ThemedText>
        </Pressable>
      </View>

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <ThemedText type="subtitle">
              {mode === 'set' ? t('settings_password_set_title') : t('settings_password_change_title')}
            </ThemedText>
            <ThemedText type="caption" style={styles.modalHint}>
              {mode === 'set'
                ? t('settings_password_set_modal_hint', { providers: providerLabel })
                : t('settings_password_change_modal_hint')}
            </ThemedText>
            <Input
              label={t('settings_password_new_label')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              dense
              containerStyle={{ marginTop: 12 }}
            />
            <Input
              label={t('settings_password_confirm_label')}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              dense
              containerStyle={{ marginTop: 10 }}
            />
            {message ? (
              <ThemedText type="caption" style={styles.error}>
                {message}
              </ThemedText>
            ) : null}
            <View style={styles.modalActions}>
              <Button variant="ghost" onPress={closeModal} disabled={busy}>
                {t('cancel')}
              </Button>
              <Button variant="primary" onPress={() => void submit()} disabled={busy} loading={busy}>
                {t('settings_password_save')}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    gap: 6,
  },
  body: {
    opacity: 0.88,
    lineHeight: 18,
  },
  statusTitle: {
    color: '#0A7F59',
  },
  link: {
    color: Brand.primary,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  modalHint: {
    marginTop: 8,
    opacity: 0.85,
    lineHeight: 18,
  },
  error: {
    marginTop: 10,
    color: '#B42318',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
});

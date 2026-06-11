import { useCallback, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchMyConsentGrants, requestGdprErasure, type ConsentGrant } from '@/features/api/consentGrants';
import {
  applyOptimisticConsentStatus,
  performConsentAction,
} from '@/features/compliance/consentActions';
import { processPendingConsentQueue } from '@/features/sync/processPendingConsentQueue';
import {
  buildDeclarationBundle,
  declarationBundleToJson,
} from '@/features/compliance/declarationBundle';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { goBackOrHome } from '@/features/navigation/routes';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';

function scopeLabel(scope: string[], t: (key: string) => string): string {
  const labels = scope
    .map((item) => {
      if (item === 'identity') return t('data_sharing_scope_identity');
      if (item === 'plots') return t('data_sharing_scope_plots');
      if (item === 'evidence') return t('data_sharing_scope_evidence');
      return item;
    })
    .filter(Boolean);
  return labels.join(', ');
}

function statusVariant(status: ConsentGrant['status']): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'active') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'revoked') return 'error';
  return 'default';
}

export default function DataSharingScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { farmer, plots } = useAppState();
  const { t } = useLanguage();
  const { isSignedIn, openSignIn } = useSignInSheet();
  const [items, setItems] = useState<ConsentGrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [erasureDetails, setErasureDetails] = useState('');
  const [erasureSubmitting, setErasureSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setItems([]);
      return;
    }
    setLoading(true);
    setHint(null);
    try {
      const queueRes = await processPendingConsentQueue();
      if (queueRes.completed > 0) {
        setHint(t('data_sharing_queue_synced', { n: String(queueRes.completed) }));
      }
      const res = await fetchMyConsentGrants();
      if (!res.ok) {
        setHint(
          res.reason === 'no_token'
            ? t('data_sharing_sign_in_required')
            : t('data_sharing_load_failed'),
        );
        setItems([]);
        return;
      }
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, t]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const exportRecords = async () => {
    if (!farmer) {
      Alert.alert(t('warning'), t('declaration_export_no_farmer'));
      return;
    }
    const bundle = buildDeclarationBundle({
      farmer,
      plots,
      appVersion: Constants.expoConfig?.version ?? null,
    });
    await Share.share({ message: declarationBundleToJson(bundle), title: 'Tracebud' });
  };

  const onApprove = async (grant: ConsentGrant) => {
    setActionId(grant.id);
    const res = await performConsentAction({ verb: 'approve', grantId: grant.id });
    setActionId(null);
    if (!res.ok) {
      Alert.alert(t('warning'), res.message ?? t('data_sharing_action_failed'));
      return;
    }
    if (res.queued) {
      setItems((prev) => applyOptimisticConsentStatus(prev, grant.id, 'approve'));
      setHint(t('data_sharing_queued_offline'));
      return;
    }
    trackEvent(ANALYTICS_EVENTS.CONSENT_GRANT_APPROVED, { grantId: grant.id });
    await refresh();
  };

  const onDeny = async (grant: ConsentGrant) => {
    setActionId(grant.id);
    const res = await performConsentAction({ verb: 'deny', grantId: grant.id });
    setActionId(null);
    if (!res.ok) {
      Alert.alert(t('warning'), res.message ?? t('data_sharing_action_failed'));
      return;
    }
    if (res.queued) {
      setItems((prev) => applyOptimisticConsentStatus(prev, grant.id, 'deny'));
      setHint(t('data_sharing_queued_offline'));
      return;
    }
    trackEvent(ANALYTICS_EVENTS.CONSENT_GRANT_DENIED, { grantId: grant.id });
    await refresh();
  };

  const onRevoke = (grant: ConsentGrant) => {
    const orgLabel = grant.grantee_org_name?.trim() || t('data_sharing_unknown_org');
    Alert.alert(t('data_sharing_revoke_title'), t('data_sharing_revoke_body', { org: orgLabel }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('data_sharing_revoke_confirm'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setActionId(grant.id);
            const reason = t('data_sharing_revoke_reason');
            const res = await performConsentAction({
              verb: 'revoke',
              grantId: grant.id,
              revocationReason: reason,
            });
            setActionId(null);
            if (!res.ok) {
              Alert.alert(t('warning'), res.message ?? t('data_sharing_action_failed'));
              return;
            }
            if (res.queued) {
              setItems((prev) => applyOptimisticConsentStatus(prev, grant.id, 'revoke'));
              setHint(t('data_sharing_queued_offline'));
              return;
            }
            trackEvent(ANALYTICS_EVENTS.CONSENT_GRANT_REVOKED, { grantId: grant.id });
            await refresh();
          })();
        },
      },
    ]);
  };

  const pending = items.filter((g) => g.status === 'pending');
  const active = items.filter((g) => g.status === 'active');

  return (
    <ThemedView style={styles.screen}>
      <LinearGradient
        colors={['#0A7F59', '#0B6F50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => goBackOrHome(router)} style={styles.backPill}>
            <Ionicons name="chevron-back" size={18} color={colors.textInverse} />
            <ThemedText type="caption" style={{ color: colors.textInverse }}>
              {t('back')}
            </ThemedText>
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
              {t('data_sharing_title')}
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textInverse, opacity: 0.9 }}>
              {t('data_sharing_subtitle')}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      <ThemedScrollView contentContainerStyle={styles.container}>
        <Card variant="outlined" style={styles.card}>
          <CardContent>
            <ThemedText type="caption" style={styles.intro}>
              {t('data_sharing_intro')}
            </ThemedText>
            <ThemedText type="caption" style={styles.note}>
              {t('data_sharing_eudr_note')}
            </ThemedText>
          </CardContent>
        </Card>

        {!isSignedIn ? (
          <Card variant="outlined" style={styles.card}>
            <CardContent>
              <ThemedText type="default">{t('data_sharing_sign_in_required')}</ThemedText>
              <View style={{ marginTop: 12 }}>
                <Button variant="primary" fullWidth onPress={() => openSignIn({ variant: 'sync' })}>
                  {t('sign_in')}
                </Button>
              </View>
            </CardContent>
          </Card>
        ) : null}

        {hint ? (
          <ThemedText type="caption" style={styles.hint}>
            {hint}
          </ThemedText>
        ) : null}

        {isSignedIn && pending.length > 0 ? (
          <>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              {t('data_sharing_pending')}
            </ThemedText>
            {pending.map((grant) => (
              <Card key={grant.id} variant="outlined" style={styles.card}>
                <CardContent>
                  <View style={styles.grantHeader}>
                    <ThemedText type="defaultSemiBold">
                      {grant.grantee_org_name?.trim() || grant.grantee_tenant_id}
                    </ThemedText>
                    <Badge variant={statusVariant(grant.status)} size="sm">
                      {t('data_sharing_status_pending')}
                    </Badge>
                  </View>
                  <ThemedText type="caption" style={styles.muted}>
                    {t('data_sharing_can_see', { scope: scopeLabel(grant.data_scope, t) })}
                  </ThemedText>
                  <View style={styles.rowActions}>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={actionId === grant.id}
                      onPress={() => void onApprove(grant)}
                    >
                      {t('data_sharing_allow')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionId === grant.id}
                      onPress={() => void onDeny(grant)}
                    >
                      {t('data_sharing_deny')}
                    </Button>
                  </View>
                </CardContent>
              </Card>
            ))}
          </>
        ) : null}

        {isSignedIn ? (
          <>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              {t('data_sharing_active')}
            </ThemedText>
            {active.length === 0 ? (
              <Card variant="outlined" style={styles.card}>
                <CardContent>
                  <ThemedText type="caption">{t('data_sharing_none_active')}</ThemedText>
                </CardContent>
              </Card>
            ) : (
              active.map((grant) => (
                <Card key={grant.id} variant="outlined" style={styles.card}>
                  <CardContent>
                    <View style={styles.grantHeader}>
                      <ThemedText type="defaultSemiBold">
                        {grant.grantee_org_name?.trim() || grant.grantee_tenant_id}
                      </ThemedText>
                      <Badge variant={statusVariant(grant.status)} size="sm">
                        {t('data_sharing_status_active')}
                      </Badge>
                    </View>
                    <ThemedText type="caption" style={styles.muted}>
                      {t('data_sharing_can_see', { scope: scopeLabel(grant.data_scope, t) })}
                    </ThemedText>
                    <View style={{ marginTop: 10 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionId === grant.id}
                        onPress={() => onRevoke(grant)}
                      >
                        {t('data_sharing_revoke')}
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </>
        ) : null}

        {isSignedIn ? (
          <Card variant="outlined" style={styles.card}>
            <CardContent>
              <ThemedText type="defaultSemiBold">{t('data_sharing_gdpr_title')}</ThemedText>
              <ThemedText type="caption" style={styles.muted}>
                {t('data_sharing_gdpr_body')}
              </ThemedText>
              <TextInput
                value={erasureDetails}
                onChangeText={setErasureDetails}
                placeholder={t('data_sharing_gdpr_placeholder')}
                multiline
                style={[
                  styles.erasureInput,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />
              <View style={{ marginTop: 10 }}>
                <Button
                  variant="outline"
                  fullWidth
                  disabled={erasureSubmitting || !erasureDetails.trim()}
                  onPress={() => {
                    void (async () => {
                      setErasureSubmitting(true);
                      const res = await requestGdprErasure(erasureDetails.trim());
                      setErasureSubmitting(false);
                      if (!res.ok) {
                        Alert.alert(t('warning'), res.message ?? t('data_sharing_action_failed'));
                        return;
                      }
                      setErasureDetails('');
                      Alert.alert(t('data_sharing_gdpr_title'), res.message);
                    })();
                  }}
                >
                  {t('data_sharing_gdpr_submit')}
                </Button>
              </View>
            </CardContent>
          </Card>
        ) : null}

        <Card variant="outlined" style={styles.card}>
          <CardContent>
            <ThemedText type="defaultSemiBold">{t('data_sharing_export_title')}</ThemedText>
            <ThemedText type="caption" style={styles.muted}>
              {t('data_sharing_export_body')}
            </ThemedText>
            <ThemedText type="caption" style={styles.footnote}>
              {t('data_sharing_export_footnote')}
            </ThemedText>
            <View style={{ marginTop: 10 }}>
              <Button variant="outline" fullWidth onPress={() => void exportRecords()}>
                {t('data_sharing_download_records')}
              </Button>
            </View>
          </CardContent>
        </Card>

        {loading ? (
          <ThemedText type="caption" style={styles.muted}>
            …
          </ThemedText>
        ) : null}
      </ThemedScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingRight: 8,
  },
  container: { padding: 16, gap: 10, paddingBottom: 32 },
  card: { marginBottom: 0 },
  intro: { color: '#374151', lineHeight: 20 },
  note: { color: '#6B7280', marginTop: 8, lineHeight: 18 },
  sectionTitle: { marginTop: 4, color: Brand.primary },
  grantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  muted: { color: '#6B7280', marginTop: 6, lineHeight: 20 },
  footnote: { color: '#9CA3AF', marginTop: 8, lineHeight: 18, fontStyle: 'italic' },
  rowActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  hint: { color: '#B45309', textAlign: 'center' },
  erasureInput: {
    marginTop: 10,
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
});

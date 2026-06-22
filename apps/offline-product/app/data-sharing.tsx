import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
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
import { Input } from '@/components/ui/input';
import {
  HEADER_GRADIENT_COLORS,
  compactTabHeaderStyles,
} from '@/constants/compactTabHeader';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchMyConsentGrants, requestGdprErasure, type ConsentGrant } from '@/features/api/consentGrants';
import { postAuditEventToBackend } from '@/features/api/audit';
import { testBackendLogin } from '@/features/api/postPlot';
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
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import { createDataSharingScreenStyles } from '@/app/dataSharingScreenStyles';

type ScopeItem = 'identity' | 'plots' | 'evidence';

function parseScope(scope: string[]): ScopeItem[] {
  return scope.filter(
    (item): item is ScopeItem =>
      item === 'identity' || item === 'plots' || item === 'evidence',
  );
}

function scopeLabelKey(item: ScopeItem): string {
  if (item === 'identity') return 'data_sharing_scope_identity';
  if (item === 'plots') return 'data_sharing_scope_plots';
  return 'data_sharing_scope_evidence';
}

function scopeIcon(item: ScopeItem): keyof typeof Ionicons.glyphMap {
  if (item === 'identity') return 'person-outline';
  if (item === 'plots') return 'map-outline';
  return 'document-text-outline';
}

function ScopeChips({ scope, t }: { scope: string[]; t: (key: string) => string }) {
  const colors = useAppColors();
  const styles = useThemedStyles(createDataSharingScreenStyles);
  const items = parseScope(scope);
  if (items.length === 0) return null;
  return (
    <View style={styles.scopeRow}>
      {items.map((item) => (
        <View key={item} style={styles.scopeChip}>
          <Ionicons name={scopeIcon(item)} size={12} color={colors.icon} />
          <ThemedText type="caption" style={styles.scopeChipText}>
            {t(scopeLabelKey(item))}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

function StatusChip({
  dotColor,
  label,
  value,
}: {
  dotColor: string;
  label: string;
  value: number;
}) {
  const styles = useThemedStyles(createDataSharingScreenStyles);
  return (
    <View style={styles.statusChip}>
      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      <ThemedText type="caption" style={styles.statusChipValue}>
        {value}
      </ThemedText>
      <ThemedText type="caption" style={styles.statusChipLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

function PendingGrantCard({
  grant,
  t,
  busy,
  onApprove,
  onDeny,
}: {
  grant: ConsentGrant;
  t: (key: string) => string;
  busy: boolean;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const colors = useAppColors();
  const styles = useThemedStyles(createDataSharingScreenStyles);
  const orgName = grant.grantee_org_name?.trim() || grant.grantee_tenant_id;
  return (
    <View style={styles.pendingCard}>
      <View style={styles.pendingAccent} />
      <View style={styles.pendingBody}>
        <View style={styles.pendingTop}>
          <View style={styles.orgMark}>
            <Ionicons name="business" size={18} color={colors.textWarningStrong} />
          </View>
          <View style={styles.pendingMain}>
            <ThemedText type="defaultSemiBold" style={styles.orgName} numberOfLines={2}>
              {orgName}
            </ThemedText>
            <ThemedText type="caption" style={styles.pendingHint}>
              {t('data_sharing_pending_hint')}
            </ThemedText>
            <ScopeChips scope={grant.data_scope} t={t} />
          </View>
        </View>
        <Button variant="primary" size="sm" fullWidth disabled={busy} onPress={onApprove}>
          {t('data_sharing_allow')}
        </Button>
        <Pressable onPress={onDeny} disabled={busy} style={styles.denyLink}>
          <ThemedText type="defaultSemiBold" style={styles.denyLinkText}>
            {t('data_sharing_deny')}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function ActiveGrantRow({
  grant,
  t,
  busy,
  isLast,
  onRevoke,
}: {
  grant: ConsentGrant;
  t: (key: string) => string;
  busy: boolean;
  isLast: boolean;
  onRevoke: () => void;
}) {
  const colors = useAppColors();
  const styles = useThemedStyles(createDataSharingScreenStyles);
  const orgName = grant.grantee_org_name?.trim() || grant.grantee_tenant_id;
  return (
    <View style={[styles.activeRow, !isLast ? styles.activeRowBorder : null]}>
      <View style={styles.activeRowMain}>
        <View style={styles.orgMarkActive}>
          <Ionicons name="business-outline" size={17} color={colors.tint} />
        </View>
        <View style={styles.activeText}>
          <ThemedText type="defaultSemiBold" numberOfLines={2}>
            {orgName}
          </ThemedText>
          <ScopeChips scope={grant.data_scope} t={t} />
        </View>
        <View style={styles.activeBadge}>
          <ThemedText type="caption" style={styles.activeBadgeText}>
            {t('data_sharing_status_active')}
          </ThemedText>
        </View>
      </View>
      <Pressable onPress={onRevoke} disabled={busy} style={styles.revokeLink}>
        <ThemedText type="caption" style={styles.revokeLinkText}>
          {t('data_sharing_revoke')}
        </ThemedText>
      </Pressable>
    </View>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const colors = useAppColors();
  const styles = useThemedStyles(createDataSharingScreenStyles);
  return (
    <Pressable onPress={onPress} style={styles.settingsRow}>
      <View style={[styles.settingsIcon, destructive ? styles.settingsIconMuted : null]}>
        <Ionicons name={icon} size={18} color={destructive ? colors.iconMuted : colors.tint} />
      </View>
      <View style={styles.settingsText}>
        <ThemedText
          type="defaultSemiBold"
          style={destructive ? styles.settingsTitleMuted : undefined}
        >
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="caption" style={styles.settingsSubtitle}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} />
    </Pressable>
  );
}

export default function DataSharingScreen() {
  const styles = useThemedStyles(createDataSharingScreenStyles);
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
  const [showPrivacyNote, setShowPrivacyNote] = useState(false);
  const [showGdpr, setShowGdpr] = useState(false);
  const [erasureDetails, setErasureDetails] = useState('');
  const [erasureSubmitting, setErasureSubmitting] = useState(false);
  const [auditSyncBusy, setAuditSyncBusy] = useState(false);

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
    setAuditSyncBusy(true);
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
      setAuditSyncBusy(false);
    }
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
        colors={[...HEADER_GRADIENT_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[compactTabHeaderStyles.header, { paddingTop: insets.top }]}
      >
        <View style={compactTabHeaderStyles.headerRowCompact}>
          <View style={[compactTabHeaderStyles.headerSideSlot, compactTabHeaderStyles.headerSideLeft]}>
            <Pressable onPress={() => goBackOrHome(router)} style={compactTabHeaderStyles.backButton}>
              <Ionicons name="chevron-back" size={20} color={colors.textInverse} />
              <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
                {t('back')}
              </ThemedText>
            </Pressable>
          </View>
          <View style={compactTabHeaderStyles.headerTitleWrap} pointerEvents="none">
            <ThemedText type="defaultSemiBold" style={compactTabHeaderStyles.headerTitleCompact}>
              {t('data_sharing_title')}
            </ThemedText>
          </View>
          <View style={[compactTabHeaderStyles.headerSideSlot, compactTabHeaderStyles.headerSideRight]} />
        </View>
      </LinearGradient>

      <ThemedScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <ThemedText type="defaultSemiBold" style={styles.heroTitle}>
            {t('data_sharing_subtitle')}
          </ThemedText>
          <ThemedText type="caption" style={styles.heroBody}>
            {t('data_sharing_intro')}
          </ThemedText>
          <Pressable onPress={() => setShowPrivacyNote((v) => !v)} style={styles.learnMoreBtn}>
            <ThemedText type="caption" style={styles.learnMoreText}>
              {showPrivacyNote ? t('data_sharing_learn_less') : t('data_sharing_learn_more')}
            </ThemedText>
            <Ionicons
              name={showPrivacyNote ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.tint}
            />
          </Pressable>
          {showPrivacyNote ? (
            <ThemedText type="caption" style={styles.privacyNote}>
              {t('data_sharing_eudr_note')}
            </ThemedText>
          ) : null}
        </View>

        {!isSignedIn ? (
          <Pressable style={styles.signInBanner} onPress={() => openSignIn({ variant: 'sync' })}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.tint} />
            <View style={styles.signInBannerText}>
              <ThemedText type="defaultSemiBold" style={styles.signInBannerTitle}>
                {t('data_sharing_sign_in_required')}
              </ThemedText>
              <ThemedText type="caption" style={styles.signInBannerSub}>
                {t('data_sharing_sign_in_cta')}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.tint} />
          </Pressable>
        ) : null}

        {hint ? (
          <View style={styles.hintBanner}>
            <Ionicons name="information-circle-outline" size={16} color={colors.link} />
            <ThemedText type="caption" style={styles.hintText}>
              {hint}
            </ThemedText>
          </View>
        ) : null}

        {isSignedIn ? (
          <View style={styles.statusRow}>
            <StatusChip
              dotColor={colors.warning}
              label={t('data_sharing_status_pending')}
              value={pending.length}
            />
            <View style={styles.statusDivider} />
            <StatusChip
              dotColor={colors.success}
              label={t('data_sharing_status_active')}
              value={active.length}
            />
            {loading ? <ActivityIndicator color={colors.tint} style={styles.inlineLoader} /> : null}
          </View>
        ) : null}

        {isSignedIn && pending.length > 0 ? (
          <View style={styles.block}>
            <ThemedText type="caption" style={styles.blockLabel}>
              {t('data_sharing_pending').toUpperCase()}
            </ThemedText>
            {pending.map((grant) => (
              <PendingGrantCard
                key={grant.id}
                grant={grant}
                t={t}
                busy={actionId === grant.id}
                onApprove={() => void onApprove(grant)}
                onDeny={() => void onDeny(grant)}
              />
            ))}
          </View>
        ) : null}

        {isSignedIn ? (
          <View style={styles.block}>
            <ThemedText type="caption" style={styles.blockLabel}>
              {t('data_sharing_active').toUpperCase()}
            </ThemedText>
            {loading && active.length === 0 && pending.length === 0 ? (
              <Card variant="outlined" padding="none">
                <CardContent style={styles.loadingCard}>
                  <ActivityIndicator color={colors.tint} />
                </CardContent>
              </Card>
            ) : active.length === 0 ? (
              <Card variant="outlined" padding="none" style={styles.emptyCard}>
                <CardContent style={styles.emptyCardInner}>
                  <Ionicons name="shield-outline" size={28} color={colors.borderStrong} />
                  <ThemedText type="caption" style={styles.emptyText}>
                    {t('data_sharing_none_active')}
                  </ThemedText>
                </CardContent>
              </Card>
            ) : (
              <Card variant="outlined" padding="none">
                {active.map((grant, index) => (
                  <ActiveGrantRow
                    key={grant.id}
                    grant={grant}
                    t={t}
                    busy={actionId === grant.id}
                    isLast={index === active.length - 1}
                    onRevoke={() => onRevoke(grant)}
                  />
                ))}
              </Card>
            )}
          </View>
        ) : null}

        <View style={styles.block}>
          <ThemedText type="caption" style={styles.blockLabel}>
            {t('data_sharing_your_data_title').toUpperCase()}
          </ThemedText>
          <Card variant="outlined" padding="none">
            <SettingsRow
              icon="download-outline"
              title={t('data_sharing_export_title')}
              subtitle={t('data_sharing_export_short')}
              onPress={() => void exportRecords()}
            />
            {isSignedIn ? (
              <>
                <View style={styles.rowDivider} />
                <Pressable
                  onPress={() => void syncDeclarationSnapshotToServer()}
                  disabled={auditSyncBusy}
                  style={styles.settingsRow}
                >
                  <View style={styles.settingsIcon}>
                    <Ionicons name="cloud-upload-outline" size={18} color={colors.tint} />
                  </View>
                  <View style={styles.settingsText}>
                    <ThemedText type="defaultSemiBold">
                      {t('declaration_sync_server')}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.settingsSubtitle}>
                      {t('data_sharing_audit_sync_short')}
                    </ThemedText>
                  </View>
                  {auditSyncBusy ? (
                    <ActivityIndicator color={colors.tint} />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} />
                  )}
                </Pressable>
                <View style={styles.rowDivider} />
                <Pressable onPress={() => setShowGdpr((v) => !v)} style={styles.settingsRow}>
                  <View style={[styles.settingsIcon, styles.settingsIconMuted]}>
                    <Ionicons name="trash-outline" size={18} color={colors.iconMuted} />
                  </View>
                  <View style={styles.settingsText}>
                    <ThemedText type="defaultSemiBold" style={styles.settingsTitleMuted}>
                      {t('data_sharing_gdpr_title')}
                    </ThemedText>
                    <ThemedText type="caption" style={styles.settingsSubtitle}>
                      {t('data_sharing_gdpr_short')}
                    </ThemedText>
                  </View>
                  <Ionicons
                    name={showGdpr ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.iconMuted}
                  />
                </Pressable>
              </>
            ) : null}
          </Card>
          {isSignedIn && showGdpr ? (
            <Card variant="outlined" padding="none" style={styles.gdprCard}>
              <CardContent style={styles.gdprCardInner}>
                <ThemedText type="caption" style={styles.gdprBody}>
                  {t('data_sharing_gdpr_body')}
                </ThemedText>
                <Input
                  value={erasureDetails}
                  onChangeText={setErasureDetails}
                  placeholder={t('data_sharing_gdpr_placeholder')}
                  multiline
                  dense
                  style={styles.erasureInput}
                />
                <Button
                  variant="outline"
                  size="sm"
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
                      setShowGdpr(false);
                      Alert.alert(t('data_sharing_gdpr_title'), res.message);
                    })();
                  }}
                >
                  {t('data_sharing_gdpr_submit')}
                </Button>
              </CardContent>
            </Card>
          ) : null}
          <ThemedText type="caption" style={styles.exportFootnote}>
            {t('data_sharing_export_footnote')}
          </ThemedText>
        </View>
      </ThemedScrollView>
    </ThemedView>
  );
}


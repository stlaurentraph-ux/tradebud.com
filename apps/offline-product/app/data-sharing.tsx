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
import { Brand, Colors, Radius, Spacing } from '@/constants/theme';
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
  const items = parseScope(scope);
  if (items.length === 0) return null;
  return (
    <View style={styles.scopeRow}>
      {items.map((item) => (
        <View key={item} style={styles.scopeChip}>
          <Ionicons name={scopeIcon(item)} size={12} color="#4B5563" />
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
  const orgName = grant.grantee_org_name?.trim() || grant.grantee_tenant_id;
  return (
    <View style={styles.pendingCard}>
      <View style={styles.pendingAccent} />
      <View style={styles.pendingBody}>
        <View style={styles.pendingTop}>
          <View style={styles.orgMark}>
            <Ionicons name="business" size={18} color="#B45309" />
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
  const orgName = grant.grantee_org_name?.trim() || grant.grantee_tenant_id;
  return (
    <View style={[styles.activeRow, !isLast ? styles.activeRowBorder : null]}>
      <View style={styles.activeRowMain}>
        <View style={styles.orgMarkActive}>
          <Ionicons name="business-outline" size={17} color={Brand.primary} />
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
  return (
    <Pressable onPress={onPress} style={styles.settingsRow}>
      <View style={[styles.settingsIcon, destructive ? styles.settingsIconMuted : null]}>
        <Ionicons name={icon} size={18} color={destructive ? '#9CA3AF' : Brand.primary} />
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
      <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
    </Pressable>
  );
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
  const [showPrivacyNote, setShowPrivacyNote] = useState(false);
  const [showGdpr, setShowGdpr] = useState(false);
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
              color={Brand.primary}
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
            <Ionicons name="lock-closed-outline" size={18} color={Brand.primary} />
            <View style={styles.signInBannerText}>
              <ThemedText type="defaultSemiBold" style={styles.signInBannerTitle}>
                {t('data_sharing_sign_in_required')}
              </ThemedText>
              <ThemedText type="caption" style={styles.signInBannerSub}>
                {t('data_sharing_sign_in_cta')}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Brand.primary} />
          </Pressable>
        ) : null}

        {hint ? (
          <View style={styles.hintBanner}>
            <Ionicons name="information-circle-outline" size={16} color="#0369A1" />
            <ThemedText type="caption" style={styles.hintText}>
              {hint}
            </ThemedText>
          </View>
        ) : null}

        {isSignedIn ? (
          <View style={styles.statusRow}>
            <StatusChip
              dotColor="#F59E0B"
              label={t('data_sharing_status_pending')}
              value={pending.length}
            />
            <View style={styles.statusDivider} />
            <StatusChip
              dotColor="#10B981"
              label={t('data_sharing_status_active')}
              value={active.length}
            />
            {loading ? <ActivityIndicator color={Brand.primary} style={styles.inlineLoader} /> : null}
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
                  <ActivityIndicator color={Brand.primary} />
                </CardContent>
              </Card>
            ) : active.length === 0 ? (
              <Card variant="outlined" padding="none" style={styles.emptyCard}>
                <CardContent style={styles.emptyCardInner}>
                  <Ionicons name="shield-outline" size={28} color="#D1D5DB" />
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
                <Pressable onPress={() => setShowGdpr((v) => !v)} style={styles.settingsRow}>
                  <View style={[styles.settingsIcon, styles.settingsIconMuted]}>
                    <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
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
                    color="#C4C4C4"
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  hero: {
    gap: 6,
  },
  heroTitle: {
    color: '#111827',
    fontSize: 17,
    lineHeight: 24,
  },
  heroBody: {
    color: '#6B7280',
    lineHeight: 20,
  },
  learnMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  learnMoreText: {
    color: Brand.primary,
    fontWeight: '600',
  },
  privacyNote: {
    color: '#4B5563',
    lineHeight: 19,
    marginTop: 4,
    paddingLeft: 2,
  },
  signInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  signInBannerText: { flex: 1, gap: 2 },
  signInBannerTitle: { color: '#111827' },
  signInBannerSub: { color: '#6B7280', lineHeight: 18 },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hintText: { flex: 1, color: '#0369A1', lineHeight: 18 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statusChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusChipValue: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  statusChipLabel: {
    color: '#6B7280',
  },
  statusDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },
  inlineLoader: {
    marginRight: 8,
  },
  block: {
    gap: Spacing.sm,
  },
  blockLabel: {
    color: '#9CA3AF',
    letterSpacing: 0.8,
    fontWeight: '600',
    marginLeft: 4,
  },
  pendingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#FDE68A',
    overflow: 'hidden',
  },
  pendingAccent: {
    width: 4,
    backgroundColor: '#F59E0B',
  },
  pendingBody: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  pendingTop: {
    flexDirection: 'row',
    gap: 10,
  },
  pendingMain: {
    flex: 1,
    gap: 4,
  },
  pendingHint: {
    color: '#92400E',
    lineHeight: 18,
  },
  orgMark: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgMarkActive: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgName: {
    color: '#111827',
  },
  denyLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  denyLinkText: {
    color: '#6B7280',
    fontSize: 14,
  },
  scopeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  scopeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scopeChipText: {
    color: '#4B5563',
    fontSize: 11,
  },
  activeRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 6,
  },
  activeRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  activeRowMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  activeText: {
    flex: 1,
    gap: 4,
  },
  activeBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeBadgeText: {
    color: '#047857',
    fontWeight: '600',
    fontSize: 11,
  },
  revokeLink: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    marginLeft: 44,
  },
  revokeLinkText: {
    color: '#B45309',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E5E7EB',
  },
  emptyCardInner: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingsIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconMuted: {
    backgroundColor: '#F3F4F6',
  },
  settingsText: {
    flex: 1,
    gap: 2,
  },
  settingsTitleMuted: {
    color: '#4B5563',
  },
  settingsSubtitle: {
    color: '#9CA3AF',
    lineHeight: 18,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 60,
  },
  gdprCard: {
    marginTop: -4,
    backgroundColor: '#FAFAFA',
  },
  gdprCardInner: {
    gap: Spacing.sm,
  },
  gdprBody: {
    color: '#6B7280',
    lineHeight: 19,
  },
  erasureInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  exportFootnote: {
    color: '#9CA3AF',
    lineHeight: 17,
    marginLeft: 4,
    fontStyle: 'italic',
  },
});

import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import type { CampaignInvitePreview } from '@/features/campaign/campaignInviteTypes';
import { clearPendingCampaignInviteId } from '@/features/campaign/campaignInviteContext';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { createCampaignInviteScreenStyles } from '@/screenStyles/campaignInviteScreenStyles';

type CampaignInvitePromptCardProps = {
  campaignId: string;
  preview: CampaignInvitePreview | null;
  loading?: boolean;
  isSignedIn: boolean;
  onDismiss: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

function formatDueDate(
  dueAt: string | null | undefined,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string | null {
  if (!dueAt) return null;
  const parsed = new Date(dueAt);
  if (Number.isNaN(parsed.getTime())) return null;
  return t('campaign_invite_due_by', { date: parsed.toLocaleDateString() });
}

export function CampaignInvitePromptCard({
  campaignId,
  preview,
  loading = false,
  isSignedIn,
  onDismiss,
  t,
}: CampaignInvitePromptCardProps) {
  const styles = useThemedStyles(createCampaignInviteScreenStyles);
  const { openSignIn } = useSignInSheet();

  const orgLabel = preview?.fromOrg?.trim();
  const title = orgLabel
    ? t('campaign_invite_banner_title_with_org', { org: orgLabel })
    : t('campaign_invite_banner_title_generic');

  const openDataSharing = () => {
    router.push({ pathname: '/data-sharing', params: { campaign: campaignId } });
  };

  const handlePrimaryPress = () => {
    if (!isSignedIn) {
      trackEvent(ANALYTICS_EVENTS.CAMPAIGN_INVITE_BANNER_CTA, { campaignId, requiresSignIn: true });
      openSignIn({
        variant: 'general',
        onSuccess: () => {
          trackEvent(ANALYTICS_EVENTS.CAMPAIGN_INVITE_BANNER_CTA, { campaignId, afterSignIn: true });
          openDataSharing();
        },
      });
      return;
    }
    trackEvent(ANALYTICS_EVENTS.CAMPAIGN_INVITE_BANNER_CTA, { campaignId });
    openDataSharing();
  };

  const handleRemindLater = () => {
    trackEvent(ANALYTICS_EVENTS.CAMPAIGN_INVITE_BANNER_DISMISSED, { campaignId });
    void clearPendingCampaignInviteId();
    onDismiss();
  };

  const dueLabel = formatDueDate(preview?.dueAt, t);
  const requestTitle = preview?.title?.trim();

  return (
    <View
      style={styles.promptCard}
      accessibilityRole="summary"
      accessibilityLabel={title}
    >
      <View style={styles.promptAccent} />
      <View style={styles.promptBody}>
        <View style={styles.promptHeader}>
          <View style={styles.promptIconWrap}>
            <Ionicons name="mail-unread-outline" size={20} color={Brand.primary} />
          </View>
          <View style={styles.promptText}>
            <ThemedText type="defaultSemiBold" style={styles.promptTitle}>
              {title}
            </ThemedText>
            {requestTitle ? (
              <ThemedText type="caption" style={styles.promptMeta}>
                {t('campaign_invite_request_label', { title: requestTitle })}
              </ThemedText>
            ) : null}
            <ThemedText type="caption" style={styles.promptBodyText}>
              {t('campaign_invite_banner_body')}
            </ThemedText>
            {dueLabel ? (
              <ThemedText type="caption" style={styles.promptMeta}>
                {dueLabel}
              </ThemedText>
            ) : null}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityHint={t('campaign_invite_banner_cta_hint')}
          onPress={handlePrimaryPress}
          disabled={loading}
          style={({ pressed }) => [styles.promptCta, (pressed || loading) && { opacity: 0.92 }]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <ThemedText type="defaultSemiBold" style={styles.promptCtaText}>
                {isSignedIn ? t('campaign_invite_banner_cta_signed_in') : t('campaign_invite_banner_cta')}
              </ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('campaign_invite_remind_later')}
          onPress={handleRemindLater}
          style={styles.remindLater}
        >
          <ThemedText type="caption" style={styles.remindLaterText}>
            {t('campaign_invite_remind_later')}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

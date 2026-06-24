import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { fetchAndCacheCampaignInvitePreview } from '@/features/campaign/fetchAndCacheCampaignInvitePreview';
import { persistPendingCampaignInviteId } from '@/features/campaign/campaignInviteContext';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { useCampaignInvitePreview } from '@/features/campaign/useCampaignInvitePreview';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { createCampaignInviteScreenStyles } from '@/screenStyles/campaignInviteScreenStyles';

/**
 * Deep link: tracebudoffline://campaign?campaign={id}
 * Persists invite, loads preview, then routes to Home where the banner continues the flow.
 */
export default function CampaignInviteScreen() {
  const params = useLocalSearchParams<{ campaign?: string }>();
  const campaignId = typeof params.campaign === 'string' ? params.campaign.trim() : '';
  const { openSignIn } = useSignInSheet();
  const { t } = useLanguage();
  const styles = useThemedStyles(createCampaignInviteScreenStyles);
  const { preview, loading: previewLoading } = useCampaignInvitePreview(campaignId || null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    if (!campaignId) {
      setBootstrapping(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      await persistPendingCampaignInviteId(campaignId);
      await fetchAndCacheCampaignInvitePreview(campaignId);
      trackEvent(ANALYTICS_EVENTS.CAMPAIGN_INVITE_DEEP_LINK_OPENED, { campaignId });
      if (!cancelled) {
        setBootstrapping(false);
        router.replace('/(tabs)');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  if (!campaignId) {
    return (
      <ThemedView style={styles.landingScreen}>
        <View style={styles.landingIconWrap}>
          <Ionicons name="alert-circle-outline" size={28} color={Brand.primary} />
        </View>
        <ThemedText type="title" style={styles.landingTitle}>
          {t('campaign_invite_missing_title')}
        </ThemedText>
        <ThemedText style={styles.landingBody}>{t('campaign_invite_missing_body')}</ThemedText>
        <Button title={t('campaign_invite_go_home')} onPress={() => router.replace('/(tabs)')} />
      </ThemedView>
    );
  }

  if (bootstrapping) {
    const orgLabel = preview?.fromOrg?.trim();
    const title = orgLabel
      ? t('campaign_invite_banner_title_with_org', { org: orgLabel })
      : t('campaign_invite_opening_title');

    return (
      <ThemedView style={styles.landingScreen}>
        <View style={styles.landingIconWrap}>
          <Ionicons name="mail-unread-outline" size={28} color={Brand.primary} />
        </View>
        <ThemedText type="title" style={styles.landingTitle}>
          {title}
        </ThemedText>
        <ThemedText style={styles.landingBody}>{t('campaign_invite_opening_body')}</ThemedText>
        <ActivityIndicator color={Brand.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.landingScreen}>
      <ThemedText type="title" style={styles.landingTitle}>
        {t('campaign_invite_opening_title')}
      </ThemedText>
      <ThemedText style={styles.landingBody}>{t('campaign_invite_opening_body')}</ThemedText>
      <Button
        title={t('campaign_invite_banner_cta')}
        onPress={() => {
          openSignIn({
            variant: 'general',
            onSuccess: () => {
              router.replace({ pathname: '/data-sharing', params: { campaign: campaignId } });
            },
          });
        }}
        disabled={previewLoading}
      />
      <Pressable onPress={() => router.replace('/(tabs)')} style={styles.remindLater}>
        <ThemedText type="caption" style={styles.remindLaterText}>
          {t('campaign_invite_go_home')}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

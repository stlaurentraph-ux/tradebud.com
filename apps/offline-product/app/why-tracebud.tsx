import { useEffect, useMemo } from 'react';
import { Image, Linking, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';

import { StackGradientHeader } from '@/components/layout/StackGradientHeader';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HEADER_GRADIENT_COLORS } from '@/constants/compactTabHeader';
import { Brand } from '@/constants/theme';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { goBackOrHome } from '@/features/navigation/routes';
import { useLanguage } from '@/features/state/LanguageContext';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import { createWhyTracebudScreenStyles } from '@/app/_whyTracebudScreenStyles';

const BENEFIT_ROWS = [
  {
    icon: 'leaf-outline' as const,
    titleKey: 'why_tracebud_benefit_free_title',
    bodyKey: 'why_tracebud_benefit_free_body',
  },
  {
    icon: 'cloud-offline-outline' as const,
    titleKey: 'why_tracebud_benefit_offline_title',
    bodyKey: 'why_tracebud_benefit_offline_body',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    titleKey: 'why_tracebud_benefit_control_title',
    bodyKey: 'why_tracebud_benefit_control_body',
  },
  {
    icon: 'map-outline' as const,
    titleKey: 'why_tracebud_benefit_proof_title',
    bodyKey: 'why_tracebud_benefit_proof_body',
  },
  {
    icon: 'storefront-outline' as const,
    titleKey: 'why_tracebud_benefit_markets_title',
    bodyKey: 'why_tracebud_benefit_markets_body',
  },
] as const;

function splitHeroTagline(tagline: string): string[] {
  return tagline
    .split('.')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `${line}.`);
}

export default function WhyTracebudScreen() {
  const styles = useThemedStyles(createWhyTracebudScreenStyles);
  const { t, lang, openLanguagePicker } = useLanguage();
  const params = useLocalSearchParams<{ source?: string }>();
  const source = typeof params.source === 'string' ? params.source : 'direct';
  const taglineLines = useMemo(() => splitHeroTagline(t('why_tracebud_hero_tagline')), [t]);

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.WHY_TRACEBUD_VIEWED, { source });
  }, [source]);

  return (
    <ThemedView style={styles.screen}>
      <StackGradientHeader
        title={t('why_tracebud_title')}
        onBack={() => goBackOrHome(router)}
        backLabel={t('back')}
        langLabel={String(lang).toUpperCase()}
        onLangPress={openLanguagePicker}
        langAccessibilityLabel={t('language_picker_title')}
      />

      <ThemedScrollView contentContainerStyle={styles.container}>
        <LinearGradient
          colors={[...HEADER_GRADIENT_COLORS]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroLogoWrap}>
            <Image
              source={require('../assets/images/tracebud-logo.png')}
              style={styles.heroLogo}
              accessibilityIgnoresInvertColors
            />
          </View>
          <View style={styles.heroTaglineBlock}>
            {taglineLines.map((line, index) => (
              <ThemedText
                key={line}
                type="defaultSemiBold"
                style={[
                  styles.heroTaglineLine,
                  index > 0 && styles.heroTaglineLineMuted,
                ]}
              >
                {line}
              </ThemedText>
            ))}
          </View>
          <ThemedText type="caption" style={styles.heroIntro}>
            {t('why_tracebud_intro')}
          </ThemedText>
        </LinearGradient>

        <Card variant="outlined" style={styles.missionCard}>
          <ThemedText type="default" style={styles.bodyText}>
            {t('why_tracebud_mission')}
          </ThemedText>
          <ThemedText type="default" style={styles.bodyText}>
            {t('why_tracebud_opportunity_lead')}
          </ThemedText>
        </Card>

        <View style={styles.sectionHeadingRow}>
          <Ionicons name="sparkles-outline" size={18} color={Brand.primary} />
          <ThemedText type="defaultSemiBold" style={styles.sectionHeading}>
            {t('why_tracebud_benefits_heading')}
          </ThemedText>
        </View>

        <Card variant="outlined" style={styles.benefitsCard}>
          {BENEFIT_ROWS.map((row, index) => (
            <View
              key={row.titleKey}
              style={[
                styles.benefitRow,
                index < BENEFIT_ROWS.length - 1 && styles.benefitRowDivider,
              ]}
            >
              <View style={styles.benefitIconWrap}>
                <Ionicons name={row.icon} size={22} color={Brand.primary} />
              </View>
              <View style={styles.benefitTextWrap}>
                <ThemedText type="defaultSemiBold" style={styles.benefitTitle}>
                  {t(row.titleKey)}
                </ThemedText>
                <ThemedText type="caption" style={styles.benefitBody}>
                  {t(row.bodyKey)}
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>

        <Card variant="outlined" style={styles.livelihoodCard}>
          <ThemedText type="defaultSemiBold" style={styles.livelihoodTitle}>
            {t('why_tracebud_livelihood_title')}
          </ThemedText>
          <ThemedText type="default" style={styles.livelihoodBody}>
            {t('why_tracebud_livelihood_body')}
          </ThemedText>
        </Card>

        <View style={styles.actions}>
          <ThemedText type="caption" style={styles.actionsHint}>
            {t('why_tracebud_actions_hint')}
          </ThemedText>
          <Button variant="secondary" fullWidth onPress={() => router.push('/data-sharing')}>
            {t('why_tracebud_cta_data_sharing')}
          </Button>
          <Button
            variant="outline"
            fullWidth
            onPress={() => Linking.openURL('mailto:support@tracebud.com').catch(() => undefined)}
          >
            {t('contact_us_btn')}
          </Button>
        </View>
      </ThemedScrollView>
    </ThemedView>
  );
}

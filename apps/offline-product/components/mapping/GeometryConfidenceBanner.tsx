import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import type {
  GeometryConfidenceAssessment,
  GeometryConfidenceTier,
} from '@/features/compliance/plotGeometryConfidence';
import type { TranslateFn } from '@/features/i18n/translate';

type GeometryConfidenceBannerProps = {
  assessment: GeometryConfidenceAssessment;
  t: TranslateFn;
  onManualTrace?: () => void;
  onRetry?: () => void;
};

function tierLabel(t: TranslateFn, tier: GeometryConfidenceTier): string {
  if (tier === 'high') return t('walk_geo_confidence_tier_high');
  if (tier === 'moderate') return t('walk_geo_confidence_tier_moderate');
  return t('walk_geo_confidence_tier_low');
}

function tierStyles(tier: GeometryConfidenceTier) {
  if (tier === 'high') {
    return { bg: '#F2FBF7', border: '#0A7F59', text: '#0A5C40' };
  }
  if (tier === 'moderate') {
    return { bg: '#FFF8E8', border: '#C98A00', text: '#7A5200' };
  }
  return { bg: '#FFF1F0', border: '#C0392B', text: '#8B291F' };
}

export function GeometryConfidenceBanner({
  assessment,
  t,
  onManualTrace,
  onRetry,
}: GeometryConfidenceBannerProps) {
  if (assessment.tier === 'high' && assessment.recommendedAction === 'none') {
    return null;
  }

  const palette = tierStyles(assessment.tier);
  const showManualTrace =
    assessment.recommendedAction === 'use_manual_trace' && onManualTrace != null;
  const showRetry = assessment.recommendedAction === 'retry_capture' && onRetry != null;

  return (
    <View style={[styles.banner, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <ThemedText type="defaultSemiBold" style={[styles.title, { color: palette.text }]}>
        {t('walk_geo_confidence_title', { tier: tierLabel(t, assessment.tier) })}
      </ThemedText>
      <ThemedText type="caption" style={styles.body}>
        {t('walk_geo_confidence_body')}
        {assessment.horizontalUncertaintyM != null
          ? ` ${t('walk_geo_confidence_precision', {
              meters: Math.round(assessment.horizontalUncertaintyM),
            })}`
          : ''}
      </ThemedText>
      {showManualTrace ? (
        <Pressable onPress={onManualTrace} style={styles.cta}>
          <ThemedText type="defaultSemiBold" style={styles.ctaText}>
            {t('walk_geo_confidence_cta_trace')}
          </ThemedText>
        </Pressable>
      ) : null}
      {showRetry ? (
        <Pressable onPress={onRetry} style={styles.cta}>
          <ThemedText type="defaultSemiBold" style={styles.ctaText}>
            {t('walk_geo_confidence_cta_retry')}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  title: {
    fontSize: 14,
  },
  body: {
    opacity: 0.85,
    lineHeight: 18,
  },
  cta: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  ctaText: {
    color: Brand.primary,
    fontSize: 14,
  },
});

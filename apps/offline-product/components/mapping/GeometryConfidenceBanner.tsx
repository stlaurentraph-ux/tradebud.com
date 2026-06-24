import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import type { AppColors } from '@/features/theme/useThemedStyles';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import { createGeometryConfidenceBannerStyles } from '@/components/mapping/geometryConfidenceBannerStyles';
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

function tierPalette(c: AppColors, tier: GeometryConfidenceTier) {
  if (tier === 'high') {
    return { bg: c.surfaceAccent, border: c.link, text: c.linkStrong };
  }
  if (tier === 'moderate') {
    return { bg: c.surfaceWarning, border: c.warning, text: c.textWarningStrong };
  }
  return { bg: c.surfaceWarning, border: c.error, text: c.textWarningStrong };
}

export function GeometryConfidenceBanner({
  assessment,
  t,
  onManualTrace,
  onRetry,
}: GeometryConfidenceBannerProps) {
  const colors = useAppColors();
  const styles = useThemedStyles(createGeometryConfidenceBannerStyles);
  if (assessment.tier === 'high' && assessment.recommendedAction === 'none') {
    return null;
  }

  const palette = tierPalette(colors, assessment.tier);
  const showManualTrace =
    assessment.recommendedAction === 'use_manual_trace' && onManualTrace != null;
  const showRetry = assessment.recommendedAction === 'retry_capture' && onRetry != null;

  const bodyKey = assessment.reasons.includes('self_intersection')
    ? 'walk_geo_confidence_body_self_intersect'
    : assessment.reasons.includes('gps_poor') || assessment.reasons.includes('gps_unknown')
      ? 'walk_geo_confidence_body_gps_poor'
      : 'walk_geo_confidence_body';

  return (
    <View style={[styles.banner, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <ThemedText type="defaultSemiBold" style={[styles.title, { color: palette.text }]}>
        {t('walk_geo_confidence_title', { tier: tierLabel(t, assessment.tier) })}
      </ThemedText>
      <ThemedText type="caption" style={styles.body}>
        {t(bodyKey)}
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


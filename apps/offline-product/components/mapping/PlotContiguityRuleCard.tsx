import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { TranslateFn } from '@/features/i18n/translate';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import { createPlotContiguityRuleCardStyles } from '@/components/mapping/plotContiguityRuleCardStyles';

type PlotContiguityRuleCardProps = {
  t: TranslateFn;
};

/** EUDR contiguity — one field per plot; split at roads/rivers/railways. */
export function PlotContiguityRuleCard({ t }: PlotContiguityRuleCardProps) {
  const colors = useAppColors();
  const styles = useThemedStyles(createPlotContiguityRuleCardStyles);
  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle-outline" size={22} color={colors.warning} />
        </View>
        <View style={styles.copy}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {t('walk_contiguity_title')}
          </ThemedText>
          <ThemedText type="caption" style={styles.body}>
            {t('walk_contiguity_body')}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}


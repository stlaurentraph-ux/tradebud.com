import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { TranslateFn } from '@/features/i18n/translate';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import { createSecondPlotOverlapTipStyles } from '@/components/mapping/secondPlotOverlapTipStyles';

type SecondPlotOverlapTipProps = {
  t: TranslateFn;
  firstPlotName: string;
  nextPlotNumber: number;
  onDismiss: () => void;
};

export function SecondPlotOverlapTip({
  t,
  firstPlotName,
  nextPlotNumber,
  onDismiss,
}: SecondPlotOverlapTipProps) {
  const colors = useAppColors();
  const styles = useThemedStyles(createSecondPlotOverlapTipStyles);
  return (
    <View style={styles.card} accessibilityRole="alert">
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="map-outline" size={22} color={colors.link} />
        </View>
        <View style={styles.copy}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {t('walk_second_plot_overlap_title', { firstPlotName })}
          </ThemedText>
          <ThemedText type="caption" style={styles.body}>
            {t('walk_second_plot_overlap_body', {
              firstPlotName,
              nextPlotNumber: String(nextPlotNumber),
            })}
          </ThemedText>
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            style={({ pressed }) => [styles.dismissBtn, pressed && styles.pressed]}
          >
            <ThemedText type="defaultSemiBold" style={styles.dismissText}>
              {t('walk_second_plot_overlap_dismiss')}
            </ThemedText>
          </Pressable>
        </View>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={t('walk_second_plot_overlap_dismiss')}
          hitSlop={8}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}


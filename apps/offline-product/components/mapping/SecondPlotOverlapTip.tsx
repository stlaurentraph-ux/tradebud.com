import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { TranslateFn } from '@/features/i18n/translate';
import { scaleText } from '@/features/demo/storeUiScale';

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
  return (
    <View style={styles.card} accessibilityRole="alert">
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="map-outline" size={22} color="#0A7F59" />
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
          <Ionicons name="close" size={20} color="#6B7280" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#AEE6D3',
    backgroundColor: '#E8F7F0',
    borderRadius: 16,
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: '#0B4F3B',
    fontSize: scaleText(15),
  },
  body: {
    color: '#1F6B57',
    lineHeight: scaleText(20),
  },
  dismissBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingVertical: 4,
  },
  dismissText: {
    color: '#0A7F59',
    fontSize: scaleText(14),
  },
  closeBtn: {
    padding: 2,
  },
  pressed: {
    opacity: 0.72,
  },
});

import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/features/state/LanguageContext';
import type { FarmerActivityItem } from '@/features/activity/farmerActivityTypes';
import { formatActivityTimestamp } from '@/features/activity/farmerActivityCache';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import { createActivityScreenStyles } from '@/screenStyles/activityScreenStyles';

function categoryIcon(category: FarmerActivityItem['category']): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case 'deforestation':
      return 'leaf-outline';
    case 'land_documents':
      return 'document-text-outline';
    case 'plot_setup':
      return 'camera-outline';
    case 'boundary':
      return 'git-branch-outline';
    case 'consent':
      return 'people-outline';
    case 'sync':
      return 'cloud-upload-outline';
    default:
      return 'notifications-outline';
  }
}

function categoryTint(category: FarmerActivityItem['category'], isAction: boolean): {
  bg: string;
  fg: string;
} {
  if (isAction) {
    return { bg: 'rgba(217, 119, 6, 0.14)', fg: '#B45309' };
  }
  switch (category) {
    case 'deforestation':
      return { bg: 'rgba(16, 185, 129, 0.14)', fg: Brand.primary };
    default:
      return { bg: 'rgba(100, 116, 139, 0.12)', fg: '#475569' };
  }
}

export function FarmerActivityRow({
  item,
  onPress,
}: {
  item: FarmerActivityItem;
  onPress: () => void;
}) {
  const colors = useAppColors();
  const styles = useThemedStyles(createActivityScreenStyles);
  const { t, lang } = useLanguage();
  const isAction = item.severity === 'action';
  const tint = categoryTint(item.category, isAction);
  const dateLabel = formatActivityTimestamp(item.occurredAt, lang);

  return (
    <Pressable
      testID={`activity-row-${item.id.replace(/[:]/g, '-')}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.rowPressable, pressed && styles.rowPressed]}
    >
      <Card variant="outlined" padding="none">
        <View style={styles.rowCard}>
          <View style={[styles.rowIconWrap, { backgroundColor: tint.bg }]}>
            <Ionicons name={categoryIcon(item.category)} size={20} color={tint.fg} />
          </View>
          <View style={styles.rowBody}>
            <ThemedText type="defaultSemiBold" style={styles.rowTitle}>
              {t(item.titleKey, item.titleParams)}
            </ThemedText>
            {item.subtitleKey ? (
              <ThemedText type="caption" style={styles.rowSubtitle}>
                {t(item.subtitleKey, item.subtitleParams)}
              </ThemedText>
            ) : null}
            {dateLabel ? (
              <ThemedText type="caption" style={styles.rowMeta}>
                {dateLabel}
              </ThemedText>
            ) : null}
            {isAction ? (
              <View style={styles.actionBadge}>
                <ThemedText type="caption" style={styles.actionBadgeText}>
                  {t('activity_badge_action')}
                </ThemedText>
              </View>
            ) : null}
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
            style={styles.rowChevron}
          />
        </View>
      </Card>
    </Pressable>
  );
}

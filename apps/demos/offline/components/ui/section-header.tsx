import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography } from '@/constants/theme';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  style,
}: SectionHeaderProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  textContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    ...Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  subtitle: {
    ...Typography.sizes.sm,
  },
  action: {
    marginLeft: Spacing.md,
  },
});

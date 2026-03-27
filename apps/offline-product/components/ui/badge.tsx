import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Brand, Radius, Spacing, Typography } from '@/constants/theme';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  icon,
  style,
}: BadgeProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: Brand.accent,
          textColor: '#FFFFFF',
          borderColor: Brand.accent,
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          textColor: '#FFFFFF',
          borderColor: '#F59E0B',
        };
      case 'error':
        return {
          backgroundColor: Brand.accentDark,
          textColor: '#FFFFFF',
          borderColor: Brand.accentDark,
        };
      case 'info':
        return {
          backgroundColor: '#E5E7EB',
          textColor: '#1F2937',
          borderColor: '#D1D5DB',
        };
      default:
        return {
          backgroundColor: '#F7FAFC',
          textColor,
          borderColor,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
        },
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.text,
          { color: variantStyles.textColor },
          size === 'sm' ? styles.textSm : styles.textMd,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

export function ComplianceBadge({
  status,
  size = 'md',
}: {
  status: 'compliant' | 'degradation_risk' | 'deforestation_detected' | 'pending';
  size?: BadgeSize;
}) {
  const getVariant = (): BadgeVariant => {
    switch (status) {
      case 'compliant':
        return 'success';
      case 'degradation_risk':
        return 'warning';
      case 'deforestation_detected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'compliant':
        return 'Compliant';
      case 'degradation_risk':
        return 'At Risk';
      case 'deforestation_detected':
        return 'Alert';
      default:
        return 'Pending';
    }
  };

  return (
    <Badge variant={getVariant()} size={size}>
      {getLabel()}
    </Badge>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.full,
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  text: {
    fontWeight: Typography.weights.semibold,
  },
  textSm: {
    ...Typography.sizes.xs,
  },
  textMd: {
    ...Typography.sizes.sm,
  },
});


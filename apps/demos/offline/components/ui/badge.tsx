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
          backgroundColor: '#E6F7EF',
          textColor: Brand.compliant,
          borderColor: Brand.compliant,
        };
      case 'warning':
        return {
          backgroundColor: '#FEF5E7',
          textColor: Brand.degradationRisk,
          borderColor: Brand.degradationRisk,
        };
      case 'error':
        return {
          backgroundColor: '#FEE2E2',
          textColor: Brand.deforestationDetected,
          borderColor: Brand.deforestationDetected,
        };
      case 'info':
        return {
          backgroundColor: '#EBF4FF',
          textColor: '#3182CE',
          borderColor: '#3182CE',
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

// Compliance-specific badge
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

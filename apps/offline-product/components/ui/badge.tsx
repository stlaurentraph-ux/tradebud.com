import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Brand, Radius, Spacing, Typography } from '@/constants/theme';
import { useAppColors } from '@/features/theme/useThemedStyles';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const BADGE_ON_COLOR = '#FFFFFF';

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  icon,
  style,
}: BadgeProps) {
  const colors = useAppColors();

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: colors.accent,
          textColor: BADGE_ON_COLOR,
          borderColor: colors.accent,
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          textColor: BADGE_ON_COLOR,
          borderColor: colors.warning,
        };
      case 'error':
        return {
          backgroundColor: Brand.accentDark,
          textColor: BADGE_ON_COLOR,
          borderColor: Brand.accentDark,
        };
      case 'info':
        return {
          backgroundColor: colors.chipBackground,
          textColor: colors.text,
          borderColor: colors.chipBorder,
        };
      default:
        return {
          backgroundColor: colors.backgroundSecondary,
          textColor: colors.text,
          borderColor: colors.border,
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
  status:
    | 'deforestation_clear'
    | 'compliant'
    | 'under_review'
    | 'degradation_risk'
    | 'deforestation_detected'
    | 'pending'
    | 'pending_check'
    | string;
  size?: BadgeSize;
}) {
  const normalized =
    status === 'pending_check' || !status ? 'pending' : status;

  const getVariant = (): BadgeVariant => {
    switch (normalized) {
      case 'deforestation_clear':
      case 'compliant':
        return 'success';
      case 'under_review':
        return 'warning';
      case 'degradation_risk':
        return 'warning';
      case 'deforestation_detected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getLabel = () => {
    switch (normalized) {
      case 'deforestation_clear':
        return 'Deforestation clear';
      case 'compliant':
        return 'Deforestation clear';
      case 'under_review':
        return 'Review';
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

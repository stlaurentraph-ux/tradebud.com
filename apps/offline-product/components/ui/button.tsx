import { forwardRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ActivityIndicator,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, Radius, Spacing, TouchTargets, Typography, Shadows } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  /** Merged after variant text styles — use for custom `style` backgrounds (e.g. force white on green). */
  textStyle?: TextStyle;
}

export const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      disabled,
      children,
      style,
      textStyle,
      ...props
    },
    ref,
  ) => {
    const background = useThemeColor({}, 'background');
    const colors = background === Colors.dark.background ? Colors.dark : Colors.light;

    const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
      switch (variant) {
        case 'primary':
          return {
            container: {
              backgroundColor: disabled ? colors.buttonDisabled : colors.buttonPrimary,
            },
            text: {
              color: disabled ? colors.buttonDisabledText : colors.buttonPrimaryText,
            },
          };
        case 'secondary':
          return {
            container: {
              backgroundColor: disabled ? colors.buttonDisabled : colors.buttonSecondary,
            },
            text: {
              color: disabled ? colors.buttonDisabledText : colors.buttonSecondaryText,
            },
          };
        case 'outline':
          return {
            container: {
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderColor: disabled ? colors.buttonDisabled : colors.tint,
            },
            text: {
              color: disabled ? colors.buttonDisabledText : colors.tint,
            },
          };
        case 'ghost':
          return {
            container: {
              backgroundColor: 'transparent',
            },
            text: {
              color: disabled ? colors.buttonDisabledText : colors.tint,
            },
          };
        case 'danger':
          return {
            container: {
              backgroundColor: disabled ? colors.buttonDisabled : colors.error,
            },
            text: {
              color: disabled ? colors.buttonDisabledText : colors.textInverse,
            },
          };
        default:
          return { container: {}, text: {} };
      }
    };

    const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
      switch (size) {
        case 'sm':
          return {
            container: {
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              minHeight: TouchTargets.minimum,
            },
            text: {
              ...Typography.sizes.sm,
              fontWeight: Typography.weights.semibold,
            },
          };
        case 'lg':
          return {
            container: {
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.lg,
              minHeight: TouchTargets.large,
            },
            text: {
              ...Typography.sizes.lg,
              fontWeight: Typography.weights.semibold,
            },
          };
        default:
          return {
            container: {
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.md,
              minHeight: TouchTargets.comfortable,
            },
            text: {
              ...Typography.sizes.base,
              fontWeight: Typography.weights.semibold,
            },
          };
      }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    return (
      <Pressable
        ref={ref}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.container,
          sizeStyles.container,
          variantStyles.container,
          fullWidth && styles.fullWidth,
          pressed && !disabled && styles.pressed,
          variant === 'primary' && !disabled && Shadows.sm,
          style,
        ]}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variantStyles.text.color} />
        ) : (
          <>
            {icon}
            <Text style={[styles.text, sizeStyles.text, variantStyles.text, textStyle]}>{children}</Text>
            {iconRight}
          </>
        )}
      </Pressable>
    );
  },
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    gap: Spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  text: {
    textAlign: 'center',
  },
});


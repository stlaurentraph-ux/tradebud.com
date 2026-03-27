import { View, StyleSheet, type ViewProps, type ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing, Shadows } from '@/constants/theme';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'md',
  children,
  style,
  ...props
}: CardProps) {
  const backgroundColor = useThemeColor({}, 'backgroundCard');
  const borderColor = useThemeColor({}, 'border');

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return { borderWidth: 1, borderColor, ...Shadows.sm };
      case 'outlined':
        return { borderWidth: 1, borderColor };
      default:
        return { borderWidth: 1, borderColor };
    }
  };

  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: Spacing.sm };
      case 'lg':
        return { padding: Spacing.xl };
      default:
        return { padding: Spacing.lg };
    }
  };

  return (
    <View
      style={[styles.card, { backgroundColor }, getVariantStyle(), getPaddingStyle(), style]}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
}

export function CardContent({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    overflow: 'visible',
  },
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  content: {
    gap: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});


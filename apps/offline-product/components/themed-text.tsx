import { StyleSheet, Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Typography } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | 'default'
    | 'title'
    | 'defaultSemiBold'
    | 'subtitle'
    | 'link'
    | 'caption'
    | 'label';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const secondaryColor = useThemeColor({}, 'textSecondary');
  const linkColor = useThemeColor({}, 'tint');

  const getTypeColor = () => {
    switch (type) {
      case 'link':
        return linkColor;
      case 'caption':
        return secondaryColor;
      default:
        return color;
    }
  };

  return (
    <Text
      style={[
        { color: getTypeColor() },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'defaultSemiBold' && styles.defaultSemiBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'caption' && styles.caption,
        type === 'label' && styles.label,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    ...Typography.sizes.base,
    fontWeight: Typography.weights.normal,
  },
  defaultSemiBold: {
    ...Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  title: {
    ...Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
  },
  subtitle: {
    ...Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  link: {
    ...Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    textDecorationLine: 'underline',
  },
  caption: {
    ...Typography.sizes.sm,
    fontWeight: Typography.weights.normal,
  },
  label: {
    ...Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

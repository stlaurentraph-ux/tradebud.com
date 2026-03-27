import { forwardRef } from 'react';
import { ScrollView, View, type ScrollViewProps, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

export type ThemedScrollViewProps = ScrollViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export const ThemedScrollView = forwardRef<ScrollView, ThemedScrollViewProps>(
  ({ style, contentContainerStyle, lightColor, darkColor, ...otherProps }, ref) => {
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
    return (
      <ScrollView
        ref={ref}
        style={[{ backgroundColor }, style]}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        {...otherProps}
      />
    );
  },
);

ThemedScrollView.displayName = 'ThemedScrollView';

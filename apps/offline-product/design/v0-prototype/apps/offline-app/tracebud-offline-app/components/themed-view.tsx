import { View, ScrollView, type ViewProps, type ScrollViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  ...otherProps 
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor }, 
    'background'
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

export type ThemedScrollViewProps = ScrollViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedScrollView({ 
  style, 
  contentContainerStyle,
  lightColor, 
  darkColor, 
  ...otherProps 
}: ThemedScrollViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor }, 
    'background'
  );

  return (
    <ScrollView 
      style={[{ backgroundColor }, style]} 
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      {...otherProps} 
    />
  );
}

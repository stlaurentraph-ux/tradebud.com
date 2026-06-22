import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import {
  HEADER_GRADIENT_COLORS,
  HEADER_GRADIENT_TEXT,
  compactTabHeaderStyles,
} from '@/constants/compactTabHeader';

type StackGradientHeaderProps = {
  title: string;
  onBack: () => void;
  backLabel?: string;
  /** `back` shows chevron + label; `close` shows an X (modals). */
  backVariant?: 'back' | 'close';
  langLabel?: string;
  onLangPress?: () => void;
  langAccessibilityLabel?: string;
};

/**
 * Green gradient header for stack screens (plot detail, documents, receipt, etc.).
 * Colors are frozen in `constants/compactTabHeader.ts` — never use theme link tokens here.
 */
export function StackGradientHeader({
  title,
  onBack,
  backLabel,
  backVariant = 'back',
  langLabel,
  onLangPress,
  langAccessibilityLabel,
}: StackGradientHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[...HEADER_GRADIENT_COLORS]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[compactTabHeaderStyles.header, { paddingTop: insets.top }]}
    >
      <View style={compactTabHeaderStyles.headerRowCompact}>
        <View style={[compactTabHeaderStyles.headerSideSlot, compactTabHeaderStyles.headerSideLeft]}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            style={backVariant === 'close' ? compactTabHeaderStyles.backButton : compactTabHeaderStyles.backPill}
          >
            <Ionicons
              name={backVariant === 'close' ? 'close' : 'chevron-back'}
              size={backVariant === 'close' ? 22 : 18}
              color={HEADER_GRADIENT_TEXT}
            />
            {backVariant === 'back' && backLabel ? (
              <ThemedText type="caption" style={{ color: HEADER_GRADIENT_TEXT }}>
                {backLabel}
              </ThemedText>
            ) : null}
          </Pressable>
        </View>
        <View style={compactTabHeaderStyles.headerTitleWrap} pointerEvents="none">
          <ThemedText
            type="defaultSemiBold"
            numberOfLines={2}
            style={compactTabHeaderStyles.headerTitleCompact}
          >
            {title}
          </ThemedText>
        </View>
        <View style={[compactTabHeaderStyles.headerSideSlot, compactTabHeaderStyles.headerSideRight]}>
          {langLabel && onLangPress ? (
            <Pressable
              onPress={onLangPress}
              accessibilityRole="button"
              accessibilityLabel={langAccessibilityLabel}
              style={compactTabHeaderStyles.langPillCompact}
            >
              <ThemedText type="caption" style={{ color: HEADER_GRADIENT_TEXT }}>
                {langLabel}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}

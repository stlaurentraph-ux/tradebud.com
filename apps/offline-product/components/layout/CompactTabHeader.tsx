import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { HOME_HEADER_LOGO_PX, compactTabHeaderStyles } from '@/constants/compactTabHeader';

const GRADIENT_COLORS = ['#0A7F59', '#0B6F50'] as const;

export type CompactTabHeaderProps = {
  paddingTop: number;
  /** Connection / sync badge — top-right, same on all tabs */
  badge: ReactNode;
  /** Left slot: Home = brand; Settings / My Plots = back button */
  left: ReactNode;
  /** When set, shows the standard centered title (Settings, My Plots). Home omits this. */
  centerTitle?: string;
  onLanguagePress: () => void;
  languageLabel: string;
  textInverseColor: string;
  /** Home: one row — brand, badge, and lang tops align; full text can wrap. */
  homeBrandLayout?: boolean;
};

/**
 * Shared green header: badge row + compact row (left + language + optional centered title).
 * Styling is frozen in `constants/compactTabHeader.ts`.
 */
export function CompactTabHeader({
  paddingTop,
  badge,
  left,
  centerTitle,
  onLanguagePress,
  languageLabel,
  textInverseColor,
  homeBrandLayout = false,
}: CompactTabHeaderProps) {
  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[compactTabHeaderStyles.header, { paddingTop }]}
    >
      {homeBrandLayout ? (
        <View style={homeHeaderUnifiedStyles.row}>
          <View style={homeHeaderUnifiedStyles.brandColumn}>{left}</View>
          <View style={homeHeaderUnifiedStyles.trailing}>
            {badge}
            <Pressable onPress={onLanguagePress} hitSlop={10}>
              <View style={compactTabHeaderStyles.langPillCompact}>
                <View style={compactTabHeaderStyles.langDot} />
                <ThemedText type="caption" style={{ color: textInverseColor }}>
                  {languageLabel.toUpperCase()}
                </ThemedText>
              </View>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={compactTabHeaderStyles.headerTopRow}>{badge}</View>
          <View style={compactTabHeaderStyles.headerRowCompact}>
            <View style={[compactTabHeaderStyles.headerSideSlot, compactTabHeaderStyles.headerSideLeft]}>
              {left}
            </View>
            <View style={[compactTabHeaderStyles.headerSideSlot, compactTabHeaderStyles.headerSideRight]}>
              <Pressable onPress={onLanguagePress} hitSlop={10}>
                <View style={compactTabHeaderStyles.langPillCompact}>
                  <View style={compactTabHeaderStyles.langDot} />
                  <ThemedText type="caption" style={{ color: textInverseColor }}>
                    {languageLabel.toUpperCase()}
                  </ThemedText>
                </View>
              </Pressable>
            </View>
            {centerTitle != null && centerTitle.length > 0 ? (
              <View style={compactTabHeaderStyles.headerTitleWrap} pointerEvents="none">
                <ThemedText
                  numberOfLines={1}
                  type="defaultSemiBold"
                  style={compactTabHeaderStyles.headerTitleCompact}
                >
                  {centerTitle}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </>
      )}
    </LinearGradient>
  );
}

/** Home only: logo + Tracebud + subtitle, left-aligned; logo size from `HOME_HEADER_LOGO_PX`. */
export function HomeHeaderBrandLeft({
  subtitle,
  logoSize = HOME_HEADER_LOGO_PX,
}: {
  subtitle: string;
  logoSize?: number;
}) {
  return (
      <View style={homeBrandStyles.row}>
      <Image
        source={require('../../assets/images/tracebud-logo.png')}
        style={[homeBrandStyles.logo, { width: logoSize, height: logoSize }]}
        resizeMode="contain"
      />
      <View style={homeBrandStyles.textCol}>
        <ThemedText type="default" style={homeBrandStyles.title}>
          Tracebud
        </ThemedText>
        <ThemedText type="caption" style={homeBrandStyles.subtitle}>
          {subtitle}
        </ThemedText>
      </View>
    </View>
  );
}

const homeHeaderUnifiedStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 4,
    paddingBottom: 8,
  },
  brandColumn: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  /** Badge + language: same vertical start as logo / title */
  trailing: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flexShrink: 0,
  },
});

const homeBrandStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minWidth: 0,
  },
  logo: {
    flexShrink: 0,
  },
  textCol: {
    flexShrink: 1,
    minWidth: 0,
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: '#FFFFFF',
    opacity: 0.92,
    fontSize: 13,
    lineHeight: 16,
    marginTop: 2,
  },
});

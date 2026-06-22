import { StyleSheet } from 'react-native';

import { Radius, Shadows, Spacing } from '@/constants/theme';
import { scaleText } from '@/features/demo/storeUiScale';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createWhyTracebudScreenStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1 },
    container: {
      padding: Spacing.lg,
      paddingBottom: 36,
      gap: 18,
    },
    heroCard: {
      borderRadius: 22,
      paddingVertical: 24,
      paddingHorizontal: 20,
      overflow: 'hidden',
      alignItems: 'center',
      gap: 14,
    },
    heroLogoWrap: {
      width: 72,
      height: 72,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.35)',
    },
    heroLogo: {
      width: 48,
      height: 48,
      resizeMode: 'contain',
    },
    heroTaglineBlock: {
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
    },
    heroTaglineLine: {
      color: '#FFFFFF',
      fontSize: scaleText(19),
      lineHeight: scaleText(26),
      fontWeight: '700',
      textAlign: 'center',
    },
    heroTaglineLineMuted: {
      color: 'rgba(255,255,255,0.88)',
      fontWeight: '600',
    },
    heroIntro: {
      color: 'rgba(255,255,255,0.92)',
      fontSize: scaleText(14),
      lineHeight: scaleText(21),
      textAlign: 'center',
      marginTop: 2,
      paddingHorizontal: 4,
    },
    missionCard: {
      gap: 12,
      padding: 18,
      borderRadius: Radius.xl,
      backgroundColor: c.backgroundCard,
      borderColor: c.border,
      ...Shadows.sm,
    },
    bodyText: {
      color: c.textSecondary,
      lineHeight: scaleText(22),
      fontSize: scaleText(15),
    },
    sectionHeadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 2,
    },
    sectionHeading: {
      color: c.text,
      fontSize: scaleText(16),
      lineHeight: scaleText(22),
    },
    benefitsCard: {
      borderRadius: Radius.xl,
      paddingVertical: 6,
      paddingHorizontal: 4,
      backgroundColor: c.backgroundCard,
      borderColor: c.border,
      ...Shadows.sm,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    benefitRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    benefitIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.avatarBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.avatarBorder,
    },
    benefitTextWrap: {
      flex: 1,
      minWidth: 0,
      gap: 4,
      paddingTop: 2,
    },
    benefitTitle: {
      color: c.text,
      fontSize: scaleText(15),
      lineHeight: scaleText(20),
    },
    benefitBody: {
      color: c.textSecondary,
      lineHeight: scaleText(20),
      fontSize: scaleText(13),
    },
    livelihoodCard: {
      gap: 10,
      padding: 18,
      borderRadius: Radius.xl,
      backgroundColor: c.surfaceAccent,
      borderColor: c.surfaceAccentBorder,
      borderLeftWidth: 4,
      borderLeftColor: c.link,
    },
    livelihoodTitle: {
      color: c.text,
      fontSize: scaleText(16),
      lineHeight: scaleText(22),
    },
    livelihoodBody: {
      color: c.textSecondary,
      lineHeight: scaleText(22),
      fontSize: scaleText(14),
    },
    actions: {
      gap: 10,
      marginTop: 4,
    },
    actionsHint: {
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: scaleText(18),
      marginBottom: 2,
    },
  });
}

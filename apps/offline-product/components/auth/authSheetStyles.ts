import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createAuthSheetStyles(c: AppColors, isDark: boolean) {
  return StyleSheet.create({
    keyboardRoot: {
      flex: 1,
    },
    backdrop: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.58)' : 'rgba(15, 23, 42, 0.45)',
      justifyContent: 'flex-end',
      paddingHorizontal: Spacing.md,
    },
    backdropPress: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 0,
    },
    card: {
      backgroundColor: c.backgroundElevated,
      borderRadius: Radius.xl,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 16,
      gap: 8,
      borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: c.border,
    },
    cardScroll: {
      zIndex: 1,
      flexGrow: 0,
    },
    cardScrollContent: {
      flexGrow: 0,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: 18,
      lineHeight: 24,
      color: c.tint,
    },
    subtitle: {
      color: c.textMuted,
      lineHeight: 18,
      marginTop: -2,
    },
    closeBtn: {
      padding: 4,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 2,
    },
    footerLink: {
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    footerLinkText: {
      color: c.link,
      fontSize: 14,
    },
    footerMutedText: {
      color: c.textMuted,
      fontSize: 14,
    },
    footerDot: {
      color: c.borderStrong,
      fontSize: 14,
    },
    hint: {
      color: c.textWarningStrong,
      textAlign: 'center',
    },
    textLink: {
      alignSelf: 'center',
      paddingVertical: 4,
    },
    textLinkLabel: {
      color: c.link,
      fontSize: 14,
    },
    welcomeTitle: {
      color: c.tint,
      fontSize: 18,
      lineHeight: 24,
    },
    welcomeBody: {
      color: c.textMuted,
      lineHeight: 18,
    },
    welcomeActions: {
      width: '100%',
      gap: Spacing.sm,
      marginTop: 4,
    },
    backupTitle: {
      color: c.tint,
      textAlign: 'center',
    },
    backupBody: {
      textAlign: 'center',
      color: c.textSecondary,
      lineHeight: 22,
    },
    backupActions: {
      marginTop: Spacing.sm,
      gap: Spacing.sm,
    },
    backupDeclineBtn: {
      alignSelf: 'center',
      paddingVertical: 8,
    },
    backupDeclineText: {
      color: c.textMuted,
    },
    backupBackdrop: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.58)' : 'rgba(15, 23, 42, 0.5)',
      justifyContent: 'center',
      padding: Spacing.lg,
    },
  });
}

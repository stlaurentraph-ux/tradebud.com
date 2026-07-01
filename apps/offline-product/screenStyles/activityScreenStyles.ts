import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createActivityScreenStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1 },
    container: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl,
      gap: Spacing.md,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 4,
    },
    metaText: {
      color: c.textMuted,
      flex: 1,
    },
    offlineBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: c.surfaceWarning,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    offlineBannerText: {
      flex: 1,
      color: c.text,
      lineHeight: 18,
    },
    emptyCard: {
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.xl,
    },
    emptyTitle: {
      color: c.text,
      textAlign: 'center',
    },
    emptyBody: {
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: Spacing.md,
    },
    signInBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.backgroundCard,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    signInBannerText: { flex: 1, gap: 2 },
    signInBannerTitle: { color: c.text },
    signInBannerSub: { color: c.textMuted, lineHeight: 18 },
    rowPressable: {
      borderRadius: Radius.xl,
    },
    rowPressed: {
      opacity: 0.92,
    },
    rowCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    rowIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: {
      flex: 1,
      gap: 4,
    },
    rowTitle: {
      color: c.text,
      lineHeight: 21,
    },
    rowSubtitle: {
      color: c.textMuted,
      lineHeight: 18,
    },
    rowMeta: {
      color: c.textSecondary,
    },
    actionBadge: {
      alignSelf: 'flex-start',
      backgroundColor: c.surfaceWarning,
      borderRadius: Radius.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginTop: 2,
    },
    actionBadgeText: {
      color: c.textWarningStrong,
      fontWeight: '600',
    },
    rowChevron: {
      marginTop: 10,
    },
    loadingWrap: {
      paddingVertical: Spacing.xl,
      alignItems: 'center',
    },
  });
}

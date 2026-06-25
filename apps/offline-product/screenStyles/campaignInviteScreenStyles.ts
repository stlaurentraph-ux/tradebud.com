import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createCampaignInviteScreenStyles(c: AppColors) {
  return StyleSheet.create({
    promptCard: {
      flexDirection: 'row',
      backgroundColor: c.backgroundCard,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: c.surfaceWarningBorder,
      overflow: 'hidden',
    },
    promptAccent: {
      width: 4,
      backgroundColor: c.warning,
    },
    promptBody: {
      flex: 1,
      padding: 14,
      gap: 10,
    },
    promptHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    promptIconWrap: {
      width: 36,
      height: 36,
      borderRadius: Radius.md,
      backgroundColor: c.surfaceWarning,
      alignItems: 'center',
      justifyContent: 'center',
    },
    promptText: {
      flex: 1,
      gap: 4,
    },
    promptTitle: {
      color: c.text,
      lineHeight: 22,
    },
    promptBodyText: {
      color: c.textMuted,
      lineHeight: 19,
    },
    promptMeta: {
      color: c.textSecondary,
      lineHeight: 18,
    },
    promptCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: Radius.lg,
      backgroundColor: c.tint,
    },
    promptCtaText: {
      color: '#FFFFFF',
    },
    remindLater: {
      alignSelf: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    remindLaterText: {
      color: c.link,
      fontWeight: '600',
    },
    landingScreen: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xl,
      gap: Spacing.md,
    },
    landingIconWrap: {
      width: 56,
      height: 56,
      borderRadius: Radius.xl,
      backgroundColor: c.surfaceWarning,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    landingTitle: {
      textAlign: 'center',
    },
    landingBody: {
      textAlign: 'center',
      color: c.textMuted,
      lineHeight: 22,
    },
    landingSteps: {
      gap: 8,
      marginTop: 4,
    },
    landingStep: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    landingStepBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.surfaceAccent,
      borderWidth: 1,
      borderColor: c.surfaceAccentBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    landingStepText: {
      flex: 1,
      color: c.textSecondary,
      lineHeight: 20,
    },
    successBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: c.surfaceAccent,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.surfaceAccentBorder,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    successText: {
      flex: 1,
      color: c.linkStrong,
      lineHeight: 20,
    },
    contextBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: c.surfaceWarning,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.surfaceWarningBorder,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    contextText: {
      flex: 1,
      color: c.textWarningStrong,
      lineHeight: 20,
    },
    mismatchBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: c.backgroundCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    mismatchText: {
      flex: 1,
      color: c.textMuted,
      lineHeight: 20,
    },
    pendingCardHighlighted: {
      borderColor: c.warning,
      borderWidth: 2,
    },
  });
}

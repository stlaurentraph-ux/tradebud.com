import { StyleSheet } from 'react-native';

import { Brand, Radius, Shadows } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';
import { scaleText } from '@/features/demo/storeUiScale';

const HOME_SCREEN_PAD = 16;
const HOME_TILE_GAP = 12;
const HOME_TILE_PAD_MIN = 16;
const HOME_TILE_ICON_SIZE = 40;
const HOME_TILE_ICON_GAP = 12;
const HOME_TILE_TEXT_GAP = 6;
const HOME_TILE_TITLE_LINE_HEIGHT = scaleText(20);
const HOME_TILE_SUBTITLE_LINE_HEIGHT = scaleText(18);

export function createHomeScreenStyles(c: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    container: {
      padding: HOME_SCREEN_PAD,
      paddingBottom: 48,
      gap: 16,
    },
    welcomeCard: {
      borderRadius: 20,
      padding: 20,
      overflow: 'hidden',
    },
    welcomeBack: {
      color: 'rgba(255,255,255,0.92)',
      fontSize: scaleText(14),
      lineHeight: scaleText(18),
    },
    welcomeName: {
      color: '#FFFFFF',
      fontSize: scaleText(28),
      lineHeight: scaleText(34),
      fontWeight: '700',
      marginTop: 2,
    },
    welcomeNewUserHint: {
      marginTop: 14,
      color: 'rgba(255,255,255,0.9)',
      fontSize: scaleText(14),
      lineHeight: scaleText(20),
    },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
    },
    statBox: {
      flex: 1,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.24)',
      paddingVertical: 10,
      paddingHorizontal: 10,
      minHeight: 68,
      justifyContent: 'space-between',
    },
    statLabel: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: scaleText(11),
      lineHeight: scaleText(14),
    },
    statValue: {
      color: '#FFFFFF',
      fontSize: scaleText(20),
      lineHeight: scaleText(24),
      marginTop: 6,
    },
    statValuePending: {
      color: '#FFE08A',
    },
    tilesSection: {
      gap: HOME_TILE_GAP,
    },
    tilesRow: {
      flexDirection: 'row',
      gap: HOME_TILE_GAP,
      alignItems: 'stretch',
    },
    tileWrapper: {
      flex: 1,
      alignSelf: 'stretch',
    },
    tileCard: {
      flex: 1,
      paddingHorizontal: HOME_TILE_PAD_MIN,
      paddingVertical: HOME_TILE_PAD_MIN,
      borderRadius: 18,
      borderColor: c.border,
      borderWidth: 1,
      backgroundColor: c.backgroundCard,
      ...Shadows.sm,
    },
    tileContent: {
      width: '100%',
      flexGrow: 1,
      justifyContent: 'flex-start',
    },
    tileTitle: {
      width: '100%',
      fontSize: scaleText(15),
      lineHeight: HOME_TILE_TITLE_LINE_HEIGHT,
      fontWeight: '600',
      color: c.text,
      flexShrink: 1,
    },
    tileSubtitle: {
      width: '100%',
      fontSize: scaleText(13),
      lineHeight: HOME_TILE_SUBTITLE_LINE_HEIGHT,
      fontWeight: '400',
      marginTop: HOME_TILE_TEXT_GAP,
      flexShrink: 1,
    },
    tileCardHighlighted: {
      borderColor: c.link,
      borderWidth: 1.8,
      backgroundColor: c.surfaceAccent,
    },
    tilePressed: {
      opacity: 0.88,
      transform: [{ scale: 0.995 }],
    },
    tileIcon: {
      width: HOME_TILE_ICON_SIZE,
      height: HOME_TILE_ICON_SIZE,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: HOME_TILE_ICON_GAP,
    },
    actionRequired: {
      padding: 18,
      borderRadius: 24,
      backgroundColor: c.surfaceAction,
      borderColor: c.surfaceActionBorder,
      borderWidth: 1.4,
      gap: 8,
    },
    actionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    actionTitle: {
      color: c.textWarning,
      fontSize: 15,
      lineHeight: 22,
    },
    actionBody: {
      color: c.textWarningStrong,
      fontSize: 13,
      lineHeight: 20,
      marginLeft: 32,
    },
    completeNowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 4,
      paddingTop: 2,
      marginLeft: 32,
    },
    completeNowText: {
      color: c.textWarningStrong,
      fontSize: 13,
      lineHeight: 20,
    },
    syncCard: {
      padding: 14,
      borderRadius: 18,
      gap: 8,
    },
    syncCardPressed: {
      opacity: 0.92,
    },
    syncHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    syncHeaderTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
    },
    syncTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pendingPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.full,
    },
    progressBarTrack: {
      height: 8,
      borderRadius: Radius.full,
      overflow: 'hidden',
      backgroundColor: 'rgba(56,161,105,0.18)',
    },
    progressFill: {
      height: 8,
      borderRadius: Radius.full,
    },
    progressFillComplete: {
      width: '100%',
      backgroundColor: Brand.success,
    },
    syncCaption: {
      marginTop: 2,
    },
    syncCaptionComplete: {
      color: c.link,
    },
    syncCaptionPending: {
      color: c.textWarningStrong,
    },
    syncCaptionOptional: {
      color: c.textMuted,
    },
    onboardingCard: {
      borderRadius: 18,
      padding: 14,
      borderColor: c.surfaceAccentBorder,
      backgroundColor: c.surfaceAccent,
      gap: 12,
    },
    onboardingHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    onboardingIconWrap: {
      width: 44,
      height: 44,
      borderRadius: Radius.lg,
      backgroundColor: c.avatarBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    onboardingAccountLinks: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    onboardingLink: {
      color: c.link,
      textDecorationLine: 'underline',
    },
    onboardingLinkSep: {
      color: c.textMuted,
    },
    onboardingCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: Radius.lg,
      backgroundColor: Brand.primary,
    },
    onboardingCtaText: {
      color: '#FFFFFF',
    },
  });
}

export type HomeScreenStyles = ReturnType<typeof createHomeScreenStyles>;

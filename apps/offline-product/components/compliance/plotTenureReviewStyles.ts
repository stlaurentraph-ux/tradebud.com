import { StyleSheet } from 'react-native';

import type { AppColors } from '@/features/theme/useThemedStyles';

export function createPlotTenureDocumentReviewListStyles(c: AppColors) {
  return StyleSheet.create({
    card: { marginBottom: 12 },
    embeddedSection: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      gap: 8,
    },
    sectionHint: {
      marginTop: 2,
      color: c.textMuted,
      lineHeight: 20,
    },
    awaitingRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: 6,
      padding: 10,
      borderRadius: 10,
      backgroundColor: c.backgroundSecondary,
    },
    awaitingText: {
      flex: 1,
      color: c.textMuted,
      lineHeight: 20,
    },
    list: {
      marginTop: 8,
      gap: 10,
    },
    item: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 12,
      gap: 10,
      backgroundColor: c.backgroundSecondary,
    },
    itemTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    itemIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.surfaceAccent,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    itemBody: {
      flex: 1,
      minWidth: 0,
      gap: 8,
    },
    itemLabel: {
      color: c.text,
      lineHeight: 22,
    },
    badgeRow: {
      alignSelf: 'flex-start',
      flexShrink: 0,
    },
    reasonBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      padding: 10,
      borderRadius: 10,
    },
    reasonBoxSuccess: {
      backgroundColor: c.surfaceAccent,
    },
    reasonBoxFailed: {
      backgroundColor: c.surfaceWarning,
    },
    reasonBoxWarning: {
      backgroundColor: c.surfaceAction,
    },
    reasonText: {
      flex: 1,
      minWidth: 0,
      color: c.textSecondary,
      lineHeight: 20,
    },
  });
}

export function tenureOutcomeReasonIconColor(
  c: AppColors,
  outcome: 'good' | 'checking' | 'fix_upload',
): string {
  if (outcome === 'fix_upload') return c.textWarningStrong;
  return c.textMuted;
}

export function tenureOutcomeReasonBoxStyleKey(
  outcome: 'good' | 'checking' | 'fix_upload',
): 'reasonBoxSuccess' | 'reasonBoxFailed' | 'reasonBoxWarning' {
  if (outcome === 'fix_upload') return 'reasonBoxFailed';
  return 'reasonBoxWarning';
}

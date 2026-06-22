import { StyleSheet } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createSettingsScreenStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: Spacing['2xl'],
      gap: 12,
    },
    card: { marginTop: 0 },
    cardInner: {
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    sectionLabel: {
      fontSize: 16,
      lineHeight: 22,
      color: c.text,
    },
    btnWrap: {
      marginTop: 8,
    },
    syncHint: {
      marginTop: 6,
      fontSize: 14,
      lineHeight: 20,
      color: c.textMuted,
    },
    syncResultBlock: {
      marginTop: 6,
      gap: 8,
    },
    syncHintSuccess: {
      color: c.link,
      fontWeight: '600',
    },
    syncHintError: {
      color: c.textWarningStrong,
      fontWeight: '600',
    },
    syncWhyLink: {
      alignSelf: 'flex-start',
      marginTop: 4,
      paddingVertical: 2,
    },
    syncWhyLinkText: {
      color: c.link,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    uploadIssuePanel: {
      marginTop: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.surfaceWarningBorder,
      backgroundColor: c.surfaceWarning,
      overflow: 'hidden',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    uploadIssueHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    uploadIssueSummary: {
      flex: 1,
      color: c.textWarning,
      fontWeight: '600',
      lineHeight: 20,
    },
    backupTechToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginTop: 4,
      paddingVertical: 4,
    },
    backupTechToggleText: {
      color: c.textMuted,
      fontSize: 12,
    },
    backupTechBody: {
      marginTop: 4,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.divider,
      gap: 6,
    },
    backupTechDetailText: {
      color: c.textMuted,
      fontSize: 12,
      lineHeight: 17,
    },
    syncQueueFilterRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    syncQueueFilterChip: {
      borderWidth: 1,
      borderColor: c.chipBorder,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: c.chipBackground,
    },
    syncQueueFilterChipActive: {
      borderColor: Brand.primary,
      backgroundColor: c.chipBackgroundActive,
    },
    syncQueueFilterChipTextActive: {
      color: c.linkStrong,
    },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    profileAvatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    nameInputWrap: {
      marginBottom: 8,
    },
    profileReadonlyTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 8,
      alignSelf: 'stretch',
    },
    profileReadonlyTextCol: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
    },
    profileReadonlyName: {
      textAlign: 'left',
      color: c.text,
    },
    profileEditActions: {
      gap: 10,
      marginTop: 16,
      paddingTop: 4,
    },
    profileAccountSection: {
      marginTop: 4,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.divider,
      gap: 4,
    },
    profileSignOutRow: {
      alignSelf: 'flex-start',
      paddingVertical: 4,
    },
    profileSignOutLink: {
      color: c.link,
      fontWeight: '600',
    },
    avatarWrap: {
      position: 'relative',
    },
    userAvatar: {
      width: 72,
      height: 72,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.avatarBackground,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: c.avatarBorder,
      flexShrink: 0,
    },
    avatarCameraBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: 999,
      backgroundColor: Brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.backgroundCard,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 20,
    },
    changeLink: { justifyContent: 'center', paddingVertical: 8 },
    changeLinkText: {
      fontSize: 16,
      lineHeight: 22,
      color: c.link,
      textDecorationLine: 'underline',
    },
    mutedText: {
      color: c.textMuted,
      marginTop: 0,
      fontSize: 15,
      lineHeight: 22,
    },
    backupIntroText: {
      marginTop: 6,
      color: c.textMuted,
      lineHeight: 20,
    },
    backupCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    notificationsCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 4,
    },
    backupStatusText: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
    },
    backupStatusOk: {
      color: c.success,
    },
    backupStatusPending: {
      color: c.warning,
    },
    advancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    advancedBody: {
      marginTop: 12,
      gap: 20,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.divider,
    },
    advancedSection: {
      gap: 8,
    },
    advancedSectionTitle: {
      fontSize: 15,
      lineHeight: 20,
      color: c.text,
    },
    dataSharingRow: {
      gap: 12,
    },
    dataSharingRowMain: {
      gap: 6,
    },
    dataSharingRowAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    greenText: {
      color: c.link,
      marginTop: 4,
      fontSize: 15,
      lineHeight: 22,
    },
    storageBarTrack: {
      marginTop: 10,
      height: 8,
      borderRadius: 999,
      backgroundColor: c.storageTrack,
      overflow: 'hidden',
      flexDirection: 'row',
    },
    storageBarSegment: {
      height: '100%',
      backgroundColor: '#1CC08B',
    },
    storageBarSegmentMaps: {
      backgroundColor: '#3B82F6',
    },
    storageBarSegmentData: {
      backgroundColor: '#8B5CF6',
    },
    storageBreakdownText: {
      color: c.textMuted,
      marginTop: 6,
      fontSize: 14,
      lineHeight: 20,
    },
    helpCard: {
      backgroundColor: c.surfaceAccentStrong,
      borderColor: c.surfaceAccentBorder,
    },
    helpTipsToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      paddingVertical: 6,
    },
    helpFarmerTips: {
      color: c.helpText,
      marginTop: 4,
      fontSize: 13,
      lineHeight: 19,
    },
    helpTipsContent: {
      gap: 4,
      marginTop: 4,
    },
    helpTipsSectionTitle: {
      color: c.helpTitle,
      marginTop: 8,
      fontSize: 14,
    },
  });
}

import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createDataSharingScreenStyles(c: AppColors) {
  return StyleSheet.create({
  screen: { flex: 1 },
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  hero: {
    gap: 6,
  },
  heroTitle: {
    color: c.text,
    fontSize: 17,
    lineHeight: 24,
  },
  heroBody: {
    color: c.textMuted,
    lineHeight: 20,
  },
  learnMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  learnMoreText: {
    color: c.link,
    fontWeight: '600',
  },
  privacyNote: {
    color: c.textSecondary,
    lineHeight: 19,
    marginTop: 4,
    paddingLeft: 2,
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
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: c.surfaceAccent,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: c.surfaceAccentBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hintText: { flex: 1, color: c.link, lineHeight: 18 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.backgroundCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statusChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusChipValue: {
    color: c.text,
    fontWeight: '700',
    fontSize: 15,
  },
  statusChipLabel: {
    color: c.textMuted,
  },
  statusDivider: {
    width: 1,
    height: 28,
    backgroundColor: c.border,
  },
  inlineLoader: {
    marginRight: 8,
  },
  block: {
    gap: Spacing.sm,
  },
  blockLabel: {
    color: c.textMuted,
    letterSpacing: 0.8,
    fontWeight: '600',
    marginLeft: 4,
  },
  pendingCard: {
    flexDirection: 'row',
    backgroundColor: c.backgroundCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: c.surfaceWarningBorder,
    overflow: 'hidden',
  },
  pendingAccent: {
    width: 4,
    backgroundColor: c.warning,
  },
  pendingBody: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  pendingTop: {
    flexDirection: 'row',
    gap: 10,
  },
  pendingMain: {
    flex: 1,
    gap: 4,
  },
  pendingHint: {
    color: c.textWarning,
    lineHeight: 18,
  },
  orgMark: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: c.surfaceWarning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgMarkActive: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: c.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgName: {
    color: c.text,
  },
  denyLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  denyLinkText: {
    color: c.textMuted,
    fontSize: 14,
  },
  scopeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  scopeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: c.backgroundSecondary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scopeChipText: {
    color: c.textSecondary,
    fontSize: 11,
  },
  activeRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 6,
  },
  activeRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  activeRowMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  activeText: {
    flex: 1,
    gap: 4,
  },
  activeBadge: {
    backgroundColor: c.surfaceAccent,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeBadgeText: {
    color: c.link,
    fontWeight: '600',
    fontSize: 11,
  },
  revokeLink: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    marginLeft: 44,
  },
  revokeLinkText: {
    color: c.textWarningStrong,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: c.backgroundSecondary,
    borderColor: c.border,
  },
  emptyCardInner: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    color: c.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingsIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: c.surfaceAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconMuted: {
    backgroundColor: c.backgroundSecondary,
  },
  settingsText: {
    flex: 1,
    gap: 2,
  },
  settingsTitleMuted: {
    color: c.textSecondary,
  },
  settingsSubtitle: {
    color: c.textMuted,
    lineHeight: 18,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
    marginLeft: 60,
  },
  gdprCard: {
    marginTop: -4,
    backgroundColor: c.backgroundSecondary,
  },
  gdprCardInner: {
    gap: Spacing.sm,
  },
  gdprBody: {
    color: c.textMuted,
    lineHeight: 19,
  },
  erasureInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  exportFootnote: {
    color: c.textMuted,
    lineHeight: 17,
    marginLeft: 4,
    fontStyle: 'italic',
  },
});
}

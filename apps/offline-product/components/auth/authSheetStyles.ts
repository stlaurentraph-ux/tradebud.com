import { StyleSheet } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';

export const authSheetStyles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 8,
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
    color: '#0B4F3B',
  },
  subtitle: {
    color: '#6B7280',
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
    color: Brand.primary,
    fontSize: 14,
  },
  footerMutedText: {
    color: '#6B7280',
    fontSize: 14,
  },
  footerDot: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  hint: {
    color: Brand.warning,
    textAlign: 'center',
  },
  textLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  textLinkLabel: {
    color: Brand.primary,
    fontSize: 14,
  },
});

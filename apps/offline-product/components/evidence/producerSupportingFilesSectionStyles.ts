import { StyleSheet } from 'react-native';

import type { AppColors } from '@/features/theme/useThemedStyles';

export function createProducerSupportingFilesSectionStyles(c: AppColors) {
  return StyleSheet.create({
  section: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.backgroundCard,
    padding: 16,
    gap: 0,
  },
  sectionMuted: {
    opacity: 0.92,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  optional: {
    color: c.textMuted,
    fontWeight: '400',
  },
  subtitle: {
    color: c.textMuted,
    lineHeight: 20,
  },
  body: {
    marginTop: 12,
    gap: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
  },
  typePrompt: {
    color: c.textSecondary,
    lineHeight: 20,
  },
  typeList: {
    gap: 12,
  },
  typeBlock: {
    gap: 8,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.backgroundSecondary,
  },
  typeRowPressed: {
    backgroundColor: c.chipBackgroundActive,
    borderColor: c.surfaceAccentBorder,
  },
  typeRowDisabled: {
    opacity: 0.55,
  },
  typeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surfaceAccent,
  },
  typeText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  typeHint: {
    color: c.textMuted,
    lineHeight: 18,
  },
  typeDocList: {
    gap: 8,
    paddingLeft: 4,
  },
  waitHint: {
    color: c.textMuted,
    lineHeight: 20,
  },
});
}

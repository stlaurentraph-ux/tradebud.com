import { StyleSheet } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createDocumentPreviewModalStyles(c: AppColors) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  closeBtn: {
    padding: 8,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  body: {
    padding: 16,
    flexGrow: 1,
  },
  image: {
    width: '100%',
    minHeight: 320,
    borderRadius: 12,
    backgroundColor: c.border,
  },
  card: {
    backgroundColor: c.backgroundCard,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  signatureLabel: {
    alignSelf: 'flex-start',
    color: c.textMuted,
  },
  fileTitle: {
    textAlign: 'center',
  },
  fileHint: {
    textAlign: 'center',
    color: c.textMuted,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  footerStacked: {
    paddingTop: 0,
  },
  deleteBtn: {
    backgroundColor: c.surfaceWarning,
    borderColor: c.surfaceWarningBorder,
  },
  deleteBtnText: {
    color: Brand.deforestationDetected,
  },
});
}

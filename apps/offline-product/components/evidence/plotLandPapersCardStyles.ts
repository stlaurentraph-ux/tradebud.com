import { StyleSheet } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createPlotLandPapersCardStyles(c: AppColors) {
  return StyleSheet.create({
  card: { gap: 0 },
  body: { marginTop: 6, color: c.textMuted },
  formats: { marginTop: 4, color: c.textMuted },
  actions: { gap: 10, marginTop: 12 },
  dataInfoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  dataInfoLinkText: {
    color: c.link,
    fontWeight: '600',
  },
  dataInfoBody: {
    color: c.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  dataInfoExpanded: {
    gap: 10,
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  privacyLinkText: {
    color: c.link,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  photoThumbWrap: {
    position: 'relative',
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: c.chipBackground,
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: c.backgroundCard,
    borderRadius: 11,
  },
  photoThumbMore: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: c.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileList: { gap: 8, marginTop: 10 },
  syncHint: { marginTop: 8, color: c.textWarningStrong },
  syncFeedback: { marginTop: 8 },
  syncFeedbackSuccess: { color: c.link },
  syncFeedbackError: { color: Brand.deforestationDetected },
  syncFeedbackInfo: { color: c.textMuted },
});
}

import { StyleSheet } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function createPlotEvidencePanelStyles(c: AppColors) {
  return StyleSheet.create({
  wrap: { gap: 12 },
  sectionCard: {
    gap: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  countBadgeWrap: {
    flexShrink: 0,
    marginTop: 2,
  },
  sectionBody: {
    marginBottom: 4,
  },
  sectionActions: {
    gap: 10,
    marginTop: 10,
  },
  promptCard: {
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: c.warning,
  },
  promptBody: {
    marginTop: 6,
  },
  requiredHint: { marginTop: 6, color: c.textWarningStrong },
  overlapSyncFeedback: { marginBottom: 4 },
  overlapSyncSuccess: { color: c.link },
  overlapSyncError: { color: Brand.deforestationDetected },
  overlapSyncInfo: { color: c.textMuted },
});
}

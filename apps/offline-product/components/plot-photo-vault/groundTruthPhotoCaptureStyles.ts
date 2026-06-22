import { StyleSheet } from 'react-native';
import type { AppColors } from '@/features/theme/useThemedStyles';
export function createGroundTruthPhotoCaptureStyles(c: AppColors) {
  return StyleSheet.create({
  stepTitle: {
    marginBottom: 4,
  },
  progressTop: {
    textAlign: 'right',
    opacity: 0.75,
    marginBottom: 6,
  },
  directionProgressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  directionChip: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  directionChipDone: {
    borderColor: c.link,
    backgroundColor: c.surfaceAccent,
  },
  directionChipActive: {
    borderWidth: 2,
    borderColor: c.link,
  },
  directionChipImage: {
    width: '100%',
    height: '100%',
  },
  directionChipLetter: {
    opacity: 0.55,
    fontWeight: '600',
  },
  retakeHint: {
    marginTop: -4,
    marginBottom: 8,
    opacity: 0.75,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: c.link,
    marginTop: 12,
  },
  gpsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  gpsDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  gpsLabel: {
    flex: 1,
  },
  gpsAccuracy: {
    opacity: 0.7,
  },
  aimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  directionTitle: {
    fontSize: 32,
    lineHeight: 36,
  },
  headingHint: {
    marginBottom: 8,
    opacity: 0.85,
  },
  compassRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.backgroundSecondary,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  summarySlot: {
    width: '48%',
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: c.backgroundSecondary,
  },
  summarySlotVerified: {
    borderColor: c.link,
    backgroundColor: c.surfaceAccent,
  },
  summaryImage: {
    width: '100%',
    height: 72,
    borderRadius: 8,
    marginBottom: 6,
  },
  summaryLabel: {
    opacity: 0.85,
  },
});
}
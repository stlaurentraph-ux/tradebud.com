import { StyleSheet } from 'react-native';

import { scaleText } from '@/features/demo/storeUiScale';

/**
 * Single source of truth for the green gradient tab headers (Home, Settings, My Plots, etc.).
 *
 * Do not copy these values into screen files — import `compactTabHeaderStyles` and/or use
 * `CompactTabHeader` from `@/components/layout/CompactTabHeader`.
 *
 * Home uses `HOME_HEADER_LOGO_PX` and a single unified row in `CompactTabHeader` (`homeBrandLayout`).
 */
export const HOME_HEADER_LOGO_PX = 42;

/** Shared with welcome card and tab headers — keep in sync with mockup green. */
export const HEADER_GRADIENT_COLORS = ['#0A7F59', '#0B6F50'] as const;

export const compactTabHeaderStyles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 4,
  },
  headerRowCompact: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 42,
    paddingTop: 6,
    paddingBottom: 4,
  },
  headerSideSlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSideLeft: {
    justifyContent: 'flex-start',
  },
  headerSideRight: {
    justifyContent: 'flex-end',
  },
  /** Centered title overlay (Settings, My Plots). Omit on Home — use left brand only. */
  headerTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 88,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 78,
  },
  headerTitleCompact: {
    color: '#FFFFFF',
    fontSize: scaleText(18),
    lineHeight: scaleText(24),
    textAlign: 'center',
    maxWidth: '100%',
  },
  langPillCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    minWidth: 54,
    justifyContent: 'center',
  },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, StyleSheet, View } from 'react-native';

import { PlotBoundaryThumbnail } from '@/components/plot-map/PlotBoundaryThumbnail';
import {
  captureAndPersistPlotListThumbnail,
  PLOT_LIST_THUMB_CAPTURE_SIZE,
} from '@/features/mapping/plotListThumbnailCapture';
import {
  findNextPlotForListThumbnailBackfill,
  isFieldMapImageryOnline,
  plotListThumbnailFileLikelyBlank,
  PLOT_LIST_THUMB_BACKFILL_IMAGERY_TIMEOUT_MS,
  PLOT_LIST_THUMB_BACKFILL_MAX_ATTEMPTS,
  PLOT_LIST_THUMB_BACKFILL_RETRY_DELAY_MS,
} from '@/features/mapping/plotListThumbnailBackfill';
import type { Plot } from '@/features/state/AppStateContext';

type PlotListThumbnailBackfillHostProps = {
  plots: Plot[];
  offlineTilesEnabled: boolean;
  offlineTilesPackId: string | null;
  mapImageryOnline: boolean;
  onMapImageryOnlineChange?: (online: boolean) => void;
  updatePlot: (plotId: string, patch: Partial<Plot>) => void;
};

type BackfillPhase = 'idle' | 'render' | 'capture';

/** Offscreen one-at-a-time backfill when satellite imagery is available (online or offline pack). */
export function PlotListThumbnailBackfillHost({
  plots,
  offlineTilesEnabled,
  offlineTilesPackId,
  mapImageryOnline,
  onMapImageryOnlineChange,
  updatePlot,
}: PlotListThumbnailBackfillHostProps) {
  const captureRef = useRef<View>(null);
  const [activePlot, setActivePlot] = useState<Plot | null>(null);
  const [phase, setPhase] = useState<BackfillPhase>('idle');
  const attemptByPlotIdRef = useRef<Map<string, number>>(new Map());
  const skippedPlotIdsRef = useRef<Set<string>>(new Set());
  const imageryPaintedRef = useRef(false);
  const busyRef = useRef(false);

  const refreshMapImageryOnline = useCallback(async () => {
    const online = await isFieldMapImageryOnline();
    onMapImageryOnlineChange?.(online);
    return online;
  }, [onMapImageryOnlineChange]);

  const scheduleNextPlot = useCallback(async () => {
    if (busyRef.current) return;

    const imageryOnline = await refreshMapImageryOnline();
    const next = await findNextPlotForListThumbnailBackfill(plots, {
      mapImageryOnline: imageryOnline,
      offlineTilesEnabled,
      offlineTilesPackId,
      skipPlotIds: skippedPlotIdsRef.current,
    });
    if (!next) return;

    if (next.listThumbnailUri?.trim()) {
      const blank = await plotListThumbnailFileLikelyBlank(next.listThumbnailUri);
      if (blank) {
        updatePlot(next.id, { listThumbnailUri: undefined });
      }
    }

    busyRef.current = true;
    imageryPaintedRef.current = false;
    setActivePlot(next);
    setPhase('render');
  }, [offlineTilesEnabled, offlineTilesPackId, plots, refreshMapImageryOnline, updatePlot]);

  const releaseAndContinue = useCallback(
    (plotId: string, success: boolean, retryDelayMs = 0) => {
      busyRef.current = false;
      imageryPaintedRef.current = false;
      setPhase('idle');
      setActivePlot(null);

      if (success) {
        attemptByPlotIdRef.current.delete(plotId);
      } else {
        const attempts = (attemptByPlotIdRef.current.get(plotId) ?? 0) + 1;
        attemptByPlotIdRef.current.set(plotId, attempts);
        if (attempts >= PLOT_LIST_THUMB_BACKFILL_MAX_ATTEMPTS) {
          skippedPlotIdsRef.current.add(plotId);
        }
      }

      const run = () => void scheduleNextPlot();
      if (retryDelayMs > 0) {
        setTimeout(run, retryDelayMs);
      } else {
        run();
      }
    },
    [scheduleNextPlot],
  );

  const startCapture = useCallback(
    (plot: Plot) => {
      setPhase('capture');
      void captureAndPersistPlotListThumbnail(captureRef.current, plot.id).then((uri) => {
        if (uri) {
          updatePlot(plot.id, { listThumbnailUri: uri });
          releaseAndContinue(plot.id, true);
          return;
        }
        releaseAndContinue(plot.id, false, PLOT_LIST_THUMB_BACKFILL_RETRY_DELAY_MS);
      });
    },
    [releaseAndContinue, updatePlot],
  );

  useEffect(() => {
    void scheduleNextPlot();
  }, [plots, mapImageryOnline, offlineTilesEnabled, offlineTilesPackId, scheduleNextPlot]);

  useEffect(() => {
    if (phase !== 'render' || !activePlot) return;

    const imageryTimeout = setTimeout(() => {
      if (!imageryPaintedRef.current) {
        releaseAndContinue(activePlot.id, false, PLOT_LIST_THUMB_BACKFILL_RETRY_DELAY_MS);
      }
    }, PLOT_LIST_THUMB_BACKFILL_IMAGERY_TIMEOUT_MS);

    return () => clearTimeout(imageryTimeout);
  }, [activePlot, phase, releaseAndContinue]);

  useEffect(() => {
    const onAppState = (state: AppStateStatus) => {
      if (state !== 'active') return;
      skippedPlotIdsRef.current.clear();
      void scheduleNextPlot();
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [scheduleNextPlot]);

  const handleImageryPainted = useCallback(() => {
    if (!activePlot || phase !== 'render' || imageryPaintedRef.current) return;
    imageryPaintedRef.current = true;
    startCapture(activePlot);
  }, [activePlot, phase, startCapture]);

  const handleImageryUnavailable = useCallback(() => {
    if (!activePlot || phase !== 'render') return;
    void refreshMapImageryOnline().finally(() => {
      releaseAndContinue(activePlot.id, false, PLOT_LIST_THUMB_BACKFILL_RETRY_DELAY_MS);
    });
  }, [activePlot, phase, refreshMapImageryOnline, releaseAndContinue]);

  if (!activePlot || phase === 'idle') return null;

  return (
    <View
      ref={captureRef}
      collapsable={false}
      pointerEvents="none"
      style={styles.captureHost}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <PlotBoundaryThumbnail
        plot={activePlot}
        size={PLOT_LIST_THUMB_CAPTURE_SIZE}
        borderRadius={0}
        offlineTilesEnabled={offlineTilesEnabled}
        offlineTilesPackId={offlineTilesPackId}
        showSatelliteTiles
        cacheOnlineTileLocally
        onImageryPainted={handleImageryPainted}
        onImageryUnavailable={handleImageryUnavailable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  captureHost: {
    position: 'absolute',
    left: -PLOT_LIST_THUMB_CAPTURE_SIZE - 8,
    top: 0,
    width: PLOT_LIST_THUMB_CAPTURE_SIZE,
    height: PLOT_LIST_THUMB_CAPTURE_SIZE,
    opacity: 1,
  },
});

import type { Plot } from '@/features/state/AppStateContext';

/** Stable offline plot id sent as clientPlotId on POST /v1/plots. */
export function resolveClientPlotId(plot: Pick<Plot, 'id'>): string {
  return plot.id;
}

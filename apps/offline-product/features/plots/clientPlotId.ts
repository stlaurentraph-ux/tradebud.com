import type { Plot } from '@/features/state/AppStateContext';

/** Stable client id stored in server `name` on POST /v1/plots. */
export function resolveClientPlotId(plot: Pick<Plot, 'id'>): string {
  return plot.id;
}

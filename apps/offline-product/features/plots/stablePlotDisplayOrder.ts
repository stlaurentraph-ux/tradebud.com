import type { Plot } from '@/features/state/AppStateContext';

type PlotDisplayOrderKey = Pick<Plot, 'id' | 'name' | 'createdAt'>;

/** Stable list order for plot pickers — do not reorder when async readiness/backend loads. */
export function comparePlotsForDisplay(a: PlotDisplayOrderKey, b: PlotDisplayOrderKey): number {
  if (a.createdAt !== b.createdAt) return b.createdAt - a.createdAt;
  const nameCmp = (a.name ?? '').localeCompare(b.name ?? '');
  if (nameCmp !== 0) return nameCmp;
  return a.id.localeCompare(b.id);
}

export function sortPlotsForDisplay<T extends PlotDisplayOrderKey>(plots: readonly T[]): T[] {
  return [...plots].sort(comparePlotsForDisplay);
}

import type { Plot } from '@/features/state/AppStateContext';

type PlotDisplayOrderKey = Pick<Plot, 'id' | 'name'> & { createdAt?: number };

/** Stable list order for plot pickers — do not reorder when async readiness/backend loads. */
export function comparePlotsForDisplay(a: PlotDisplayOrderKey, b: PlotDisplayOrderKey): number {
  const aCreated = a.createdAt ?? 0;
  const bCreated = b.createdAt ?? 0;
  if (aCreated !== bCreated) return bCreated - aCreated;
  const nameCmp = (a.name ?? '').localeCompare(b.name ?? '');
  if (nameCmp !== 0) return nameCmp;
  return a.id.localeCompare(b.id);
}

export function sortPlotsForDisplay<T extends PlotDisplayOrderKey>(plots: readonly T[]): T[] {
  return [...plots].sort(comparePlotsForDisplay);
}

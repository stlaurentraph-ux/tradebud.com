import type { LocalPlotForBackendMatch } from '@/features/plots/backendPlotMatch';

import {
  countStoreDemoHarvestVouchers,
  getStoreDemoBackendPlots,
} from './storeDemoApiFixtures';

export type StoreDemoBackendPlot = ReturnType<typeof getStoreDemoBackendPlots>[number];

export function findStoreDemoBackendPlot(
  localPlot: Pick<LocalPlotForBackendMatch, 'name'> & { id?: string },
): StoreDemoBackendPlot | null {
  const rows = getStoreDemoBackendPlots();
  const byClientId = rows.find((r) => r.client_plot_id === localPlot.id);
  if (byClientId) return byClientId;
  const byName = rows.find((r) => String(r.name) === String(localPlot.name ?? ''));
  return byName ?? null;
}

export function storeDemoPlotIsCompliant(
  localPlot: Pick<LocalPlotForBackendMatch, 'name'> & { id?: string },
): boolean {
  return findStoreDemoBackendPlot(localPlot)?.status === 'compliant';
}

export function storeDemoHarvestCount(
  localPlot: Pick<LocalPlotForBackendMatch, 'name'> & { id?: string },
): number {
  const row = findStoreDemoBackendPlot(localPlot);
  if (!row) return 0;
  return countStoreDemoHarvestVouchers(row.id);
}

import type { Plot } from '@/features/state/AppStateContext';
import {
  backendRowMatchesLocalClientId,
  isServerOnlyDemoPlot,
  type BackendPlotRow,
} from '@/features/plots/backendPlotMatch';

export function serverPlotRowAlreadyOnDevice(
  row: BackendPlotRow,
  localPlots: readonly Plot[],
  plotServerLinks: Record<string, string>,
): boolean {
  const serverId = String(row.id ?? '').trim();
  if (!serverId) return true;

  for (const localPlot of localPlots) {
    if (plotServerLinks[localPlot.id]?.trim() === serverId) return true;
    if (backendRowMatchesLocalClientId(row, localPlot.id)) return true;
    if (localPlot.id === serverId) return true;
  }
  return false;
}

/** Server plots that restoreLocalPlotsFromServer would pull down (not gross count delta). */
export function countServerPlotsMissingOnDevice(params: {
  backendPlots: readonly unknown[];
  localPlots: readonly Plot[];
  plotServerLinks: Record<string, string>;
}): number {
  let missing = 0;
  for (const rawRow of params.backendPlots) {
    const row = rawRow as BackendPlotRow;
    if (isServerOnlyDemoPlot(row)) continue;
    if (serverPlotRowAlreadyOnDevice(row, params.localPlots, params.plotServerLinks)) continue;
    missing += 1;
  }
  return missing;
}

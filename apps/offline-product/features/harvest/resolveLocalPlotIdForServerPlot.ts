import {
  backendRowClientPlotId,
  backendRowMatchesLocalClientId,
  type BackendPlotRow,
} from '@/features/plots/backendPlotMatch';
import type { PlotServerLinks } from '@/features/plots/plotServerLink';
import type { Plot } from '@/features/state/AppStateContext';

/** Map a server plot id to the on-device plot row after cloud restore / link reconcile. */
export function resolveLocalPlotIdForServerPlot(params: {
  serverPlotId: string;
  localPlots: readonly Plot[];
  plotServerLinks: PlotServerLinks;
  backendPlots: readonly unknown[];
}): string | null {
  const serverPlotId = params.serverPlotId.trim();
  if (!serverPlotId) return null;

  for (const plot of params.localPlots) {
    if (params.plotServerLinks[plot.id]?.trim() === serverPlotId) return plot.id;
  }

  for (const raw of params.backendPlots) {
    const row = raw as BackendPlotRow;
    if (String(row.id ?? '').trim() !== serverPlotId) continue;
    const clientId = backendRowClientPlotId(row);
    if (clientId) {
      const byClient = params.localPlots.find((plot) => plot.id === clientId);
      if (byClient) return byClient.id;
      if (backendRowMatchesLocalClientId(row, clientId)) return clientId;
    }
  }

  const byServerId = params.localPlots.find((plot) => plot.id === serverPlotId);
  if (byServerId) return byServerId.id;

  return null;
}

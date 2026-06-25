import type { Plot } from '@/features/state/AppStateContext';
import {
  inboundPlotMediaKey,
  isInboundHydrated,
} from '@/features/sync/deviceSyncMarkers';

/** Linked plots already pulled synced-evidence metadata on this device. */
export async function areLinkedPlotMediaScopesHydrated(
  localPlots: Plot[],
  plotServerLinks: Record<string, string>,
): Promise<boolean> {
  const linked = localPlots.filter((plot) => Boolean(plotServerLinks[plot.id]?.trim()));
  if (linked.length === 0) return true;
  for (const plot of linked) {
    if (!(await isInboundHydrated(inboundPlotMediaKey(plot.id)))) return false;
  }
  return true;
}

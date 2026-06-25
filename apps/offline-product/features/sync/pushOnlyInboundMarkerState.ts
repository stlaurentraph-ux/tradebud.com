import type { Plot } from '@/features/state/AppStateContext';
import {
  isPlotEvidencePendingUpload,
  isPlotGroundPhotoPendingUpload,
  isPlotTitlePhotoPendingUpload,
  loadEvidenceForPlot,
  loadPhotosForPlot,
  loadTitlePhotosForPlot,
} from '@/features/state/persistence';
import {
  inboundPlotMediaKey,
  isInboundHydrated,
  markInboundHydrated,
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

/**
 * Treat plot media as hydrated when inbound markers exist, or when local media has
 * nothing pending upload (device-origin data — no server pull needed).
 */
export async function resolveLinkedPlotMediaHydrationForSync(
  localPlots: Plot[],
  plotServerLinks: Record<string, string>,
): Promise<boolean> {
  const linked = localPlots.filter((plot) => Boolean(plotServerLinks[plot.id]?.trim()));
  if (linked.length === 0) return true;

  let allReady = true;
  for (const plot of linked) {
    if (await isInboundHydrated(inboundPlotMediaKey(plot.id))) continue;

    const [groundPhotos, titlePhotos, evidence] = await Promise.all([
      loadPhotosForPlot(plot.id).catch(() => []),
      loadTitlePhotosForPlot(plot.id).catch(() => []),
      loadEvidenceForPlot(plot.id).catch(() => []),
    ]);
    const hasPendingUpload =
      groundPhotos.some(isPlotGroundPhotoPendingUpload) ||
      titlePhotos.some(isPlotTitlePhotoPendingUpload) ||
      evidence.some(isPlotEvidencePendingUpload);
    if (hasPendingUpload) {
      allReady = false;
      continue;
    }

    await markInboundHydrated(inboundPlotMediaKey(plot.id)).catch(() => undefined);
  }
  return allReady;
}

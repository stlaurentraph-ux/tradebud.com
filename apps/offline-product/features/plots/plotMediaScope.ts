import {
  backendRowClientPlotId,
  plotClientIdsShareCreationSuffix,
  type BackendPlotRow,
} from '@/features/plots/backendPlotMatch';

/** On-device plot ids that may hold media after farmer rekey (local + stale server client ids). */
export function plotIdsSharingMediaScope(
  localPlotId: string,
  backendPlots: readonly unknown[],
): string[] {
  const scoped = new Set<string>([localPlotId.trim()].filter(Boolean));
  for (const raw of backendPlots) {
    const clientId = backendRowClientPlotId(raw as BackendPlotRow);
    if (clientId && plotClientIdsShareCreationSuffix(clientId, localPlotId)) {
      scoped.add(clientId);
    }
  }
  return [...scoped];
}

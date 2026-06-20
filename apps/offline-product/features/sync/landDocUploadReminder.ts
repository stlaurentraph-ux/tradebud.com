import { fetchPlotTenureVerification } from '@/features/api/postPlot';
import { evaluateTenureParseGate } from '@/features/compliance/plotChecklist';
import { findBackendPlotForLocal } from '@/features/plots/backendPlotMatch';
import type { Plot } from '@/features/state/AppStateContext';
import { loadEvidenceForPlot, loadTitlePhotosForPlot } from '@/features/state/persistence';

export { appendLandDocsReminderToSyncCompleteMessage } from '@/features/sync/landDocUploadReminderMessage';

/** Synced plots with land papers on phone but no server tenure-check row yet. */
export async function listSyncedPlotNamesWithLocalLandDocsOnly(params: {
  plots: Plot[];
  backendPlots: unknown[];
}): Promise<string[]> {
  const names: string[] = [];

  for (const plot of params.plots) {
    const backendMatch = findBackendPlotForLocal(plot, params.backendPlots);
    const backendPlotId = backendMatch?.id != null ? String(backendMatch.id) : null;
    if (!backendPlotId) continue;

    const [titleRows, evidenceRows] = await Promise.all([
      loadTitlePhotosForPlot(plot.id).catch(() => []),
      loadEvidenceForPlot(plot.id).catch(() => []),
    ]);
    const evidenceKinds = evidenceRows
      .map((row) => row.kind)
      .filter((kind): kind is string => typeof kind === 'string' && kind.length > 0);
    const hasLandDocuments =
      titleRows.length > 0 || evidenceKinds.includes('tenure_evidence');
    if (!hasLandDocuments) continue;

    const tenureVerifications = await fetchPlotTenureVerification(backendPlotId).catch(() => []);
    const gate = evaluateTenureParseGate({
      hasLandDocuments,
      isSyncedToServer: true,
      tenureVerifications,
    });
    if (gate === 'documents_local_only') {
      const label = plot.name?.trim();
      if (label) names.push(label);
    }
  }

  return names;
}

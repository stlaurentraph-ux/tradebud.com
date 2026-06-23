/** Home sync card: pending work vs device-remembered server backup (signed in or out). */
export function summarizeHomeBackupAttention(params: {
  plotCount: number;
  pendingQueueCount: number;
  unsyncedPlotCount: number;
  blockedPlotCount: number;
}) {
  const totalPendingSync =
    params.pendingQueueCount + params.unsyncedPlotCount + params.blockedPlotCount;
  const hasPlots = params.plotCount > 0;
  return {
    totalPendingSync,
    needsBackupAttention: hasPlots && totalPendingSync > 0,
    plotsBackedUpOnDevice: hasPlots && totalPendingSync === 0,
  };
}

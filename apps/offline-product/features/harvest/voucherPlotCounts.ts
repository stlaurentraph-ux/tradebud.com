/** Count harvest vouchers linked to a plot (server id, local id, or client_plot_id). */
export function countVouchersForPlot(params: {
  vouchers: readonly unknown[];
  backendPlotId?: string | null;
  localPlotId?: string | null;
}): number {
  const backendId = params.backendPlotId ? String(params.backendPlotId) : '';
  const localId = params.localPlotId ? String(params.localPlotId) : '';
  if (!backendId && !localId) return 0;

  return params.vouchers.filter((row) => {
    const v = row as {
      plot_id?: unknown;
      plotId?: unknown;
      client_plot_id?: unknown;
    };
    const pid = String(v.plot_id ?? v.plotId ?? '');
    if (backendId && pid === backendId) return true;
    if (localId && pid === localId) return true;
    const clientPlotId = String(v.client_plot_id ?? '');
    return Boolean(localId && clientPlotId === localId);
  }).length;
}

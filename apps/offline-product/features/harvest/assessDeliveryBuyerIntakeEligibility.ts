import { normalizeBackendPlotStatus } from '@/features/compliance/plotDeforestationStatus';

const BUYER_INTAKE_READY_STATUSES = new Set(['verified', 'deforestation_clear', 'compliant']);

export type DeliveryBuyerIntakeEligibility = {
  ready: boolean;
  plotStatus: string;
  advisoryKey: 'delivery_intake_plot_ready' | 'delivery_intake_plot_pending';
};

export function assessDeliveryBuyerIntakeEligibility(plotStatus: unknown): DeliveryBuyerIntakeEligibility {
  const raw = String(plotStatus ?? '').trim();
  const normalized = normalizeBackendPlotStatus(plotStatus);
  const ready =
    BUYER_INTAKE_READY_STATUSES.has(raw) ||
    BUYER_INTAKE_READY_STATUSES.has(String(normalized));
  return {
    ready,
    plotStatus: raw || String(normalized),
    advisoryKey: ready ? 'delivery_intake_plot_ready' : 'delivery_intake_plot_pending',
  };
}

export function resolveBackendPlotStatusForLocalPlot(
  backendPlots: unknown[],
  serverPlotId: string | null,
): unknown {
  if (!serverPlotId || !Array.isArray(backendPlots)) return null;
  const match = backendPlots.find((row) => {
    if (!row || typeof row !== 'object') return false;
    const id = (row as { id?: unknown }).id;
    return String(id ?? '') === serverPlotId;
  });
  if (!match || typeof match !== 'object') return null;
  return (match as { status?: unknown }).status ?? null;
}

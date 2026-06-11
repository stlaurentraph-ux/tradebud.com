export type PlotScreeningContext = {
  signal: 'unknown' | 'canopy_stable' | 'mixed' | 'loss_confirmed';
  signalLabel: string;
  tropicalTreeCoverAvgPct: number | null;
  tropicalTreeCoverAreaHa: number | null;
  treeCoverLossHa: number | null;
  naturalForestHa: number | null;
  alertCount: number | null;
  alertAreaHa: number | null;
  signalTier: string | null;
  contextAdjusted: boolean;
  screenedAt: string | null;
  datasets: Array<{ dataset: string; ok: boolean; error?: string }>;
};

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function signalLabel(signal: PlotScreeningContext['signal']): string {
  switch (signal) {
    case 'canopy_stable':
      return 'Stable canopy (agroforestry-consistent)';
    case 'loss_confirmed':
      return 'Confirmed canopy loss';
    case 'mixed':
      return 'Mixed context — manual review';
    default:
      return 'Context unavailable';
  }
}

export function parsePlotScreeningContext(raw: unknown): PlotScreeningContext | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const context =
    row.context && typeof row.context === 'object'
      ? (row.context as Record<string, unknown>)
      : null;

  const signalRaw = readString(context?.signal) ?? 'unknown';
  const signal: PlotScreeningContext['signal'] =
    signalRaw === 'canopy_stable' ||
    signalRaw === 'loss_confirmed' ||
    signalRaw === 'mixed' ||
    signalRaw === 'unknown'
      ? signalRaw
      : 'unknown';

  const layers = Array.isArray(context?.layers) ? context.layers : [];
  const datasets = layers
    .filter((layer): layer is Record<string, unknown> => Boolean(layer && typeof layer === 'object'))
    .map((layer) => ({
      dataset: readString(layer.dataset) ?? 'unknown',
      ok: layer.ok === true,
      error: readString(layer.error) ?? undefined,
    }));

  return {
    signal,
    signalLabel: signalLabel(signal),
    tropicalTreeCoverAvgPct: readNumber(context?.tropicalTreeCoverAvgPct),
    tropicalTreeCoverAreaHa: readNumber(context?.tropicalTreeCoverAreaHa),
    treeCoverLossHa: readNumber(context?.treeCoverLossHa),
    naturalForestHa: readNumber(context?.naturalForestHa),
    alertCount: readNumber(row.alertCount),
    alertAreaHa: readNumber(row.alertAreaHa),
    signalTier: readString(row.signalTier),
    contextAdjusted: row.contextAdjusted === true,
    screenedAt: readString(row.screenedAt),
    datasets,
  };
}

export function contextSignalClass(signal: PlotScreeningContext['signal']): string {
  switch (signal) {
    case 'canopy_stable':
      return 'bg-emerald-500/10 text-emerald-800 border-emerald-200';
    case 'loss_confirmed':
      return 'bg-red-500/10 text-red-800 border-red-200';
    case 'mixed':
      return 'bg-amber-500/10 text-amber-800 border-amber-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

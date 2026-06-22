export type PlotNameRef = {
  id: string;
  farmerId: string;
  name: string;
};

export function normalizePlotName(name: string): string {
  return name.trim().toLowerCase();
}

/** Returns the conflicting plot when the farmer already uses this name (case-insensitive). */
export function findDuplicatePlotName(params: {
  plots: PlotNameRef[];
  farmerId: string;
  name: string;
  excludePlotId?: string;
}): PlotNameRef | null {
  const farmerId = params.farmerId.trim();
  const normalized = normalizePlotName(params.name);
  if (!farmerId || !normalized) return null;

  return (
    params.plots.find((plot) => {
      if (params.excludePlotId && plot.id === params.excludePlotId) return false;
      if (plot.farmerId !== farmerId) return false;
      return normalizePlotName(plot.name) === normalized;
    }) ?? null
  );
}

export function hasDuplicatePlotName(params: {
  plots: PlotNameRef[];
  farmerId: string;
  name: string;
  excludePlotId?: string;
}): boolean {
  return findDuplicatePlotName(params) != null;
}

/** First unused default label for a farmer (e.g. Plot 1, Plot 2, …). */
export function proposeUniqueDefaultPlotName(
  plots: PlotNameRef[],
  farmerId: string,
  options?: { prefix?: string; excludePlotId?: string; maxAttempts?: number },
): string {
  const prefix = options?.prefix ?? 'Plot';
  const farmer = farmerId.trim();
  const maxAttempts = options?.maxAttempts ?? Math.max(plots.length + 10, 20);

  for (let n = 1; n <= maxAttempts; n++) {
    const candidate = `${prefix} ${n}`;
    if (
      !hasDuplicatePlotName({
        plots,
        farmerId: farmer,
        name: candidate,
        excludePlotId: options?.excludePlotId,
      })
    ) {
      return candidate;
    }
  }

  return `${prefix} ${plots.length + 1}`;
}

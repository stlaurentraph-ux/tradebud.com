/** Pick the farmer id that owns most on-device plots (offline single-producer default). */
export function resolveDominantFarmerIdFromPlots(
  plots: readonly { farmerId: string }[],
): string | null {
  if (plots.length === 0) return null;
  const counts = new Map<string, number>();
  for (const plot of plots) {
    const id = plot.farmerId?.trim();
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [id, count] of counts) {
    if (count > bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}

export function plotsMismatchFarmer(
  plots: readonly { farmerId: string }[],
  farmerId: string | null | undefined,
): boolean {
  if (!farmerId || plots.length === 0) return false;
  return plots.some((plot) => plot.farmerId !== farmerId);
}

/**
 * The Harvests tab hosts several full-screen sub-flows inline (multi-plot delivery wizard, record
 * weight, new harvest log). The header back button and the Android hardware back button must both
 * step back through these sub-views instead of switching tabs / exiting the app. This pure resolver
 * decides which sub-view a "back" press should close, so the header and the `BackHandler` stay in
 * sync and the decision is unit-testable.
 */
export type HarvestSubViewState = {
  showMultiPlotDelivery: boolean;
  showRecordWeight: boolean;
  showNewHarvestLog: boolean;
};

export type HarvestBackTarget = 'multi_plot' | 'record_weight' | 'new_log' | null;

export function resolveHarvestBackTarget(state: HarvestSubViewState): HarvestBackTarget {
  if (state.showMultiPlotDelivery) return 'multi_plot';
  if (state.showRecordWeight) return 'record_weight';
  if (state.showNewHarvestLog) return 'new_log';
  return null;
}

import { describe, expect, it } from 'vitest';

import { resolveHarvestBackTarget } from './harvestBackTarget';

describe('resolveHarvestBackTarget', () => {
  it('returns null when no sub-view is open (let the OS handle back / tab nav)', () => {
    expect(
      resolveHarvestBackTarget({
        showMultiPlotDelivery: false,
        showRecordWeight: false,
        showNewHarvestLog: false,
      }),
    ).toBeNull();
  });

  it('prioritises the multi-plot delivery wizard', () => {
    expect(
      resolveHarvestBackTarget({
        showMultiPlotDelivery: true,
        showRecordWeight: true,
        showNewHarvestLog: true,
      }),
    ).toBe('multi_plot');
  });

  it('closes record-weight before the new-log selector', () => {
    expect(
      resolveHarvestBackTarget({
        showMultiPlotDelivery: false,
        showRecordWeight: true,
        showNewHarvestLog: true,
      }),
    ).toBe('record_weight');
  });

  it('closes the new harvest log when it is the only open sub-view', () => {
    expect(
      resolveHarvestBackTarget({
        showMultiPlotDelivery: false,
        showRecordWeight: false,
        showNewHarvestLog: true,
      }),
    ).toBe('new_log');
  });
});

import { describe, expect, it } from 'vitest';

import { comparePlotsForDisplay, sortPlotsForDisplay } from './stablePlotDisplayOrder';

describe('stablePlotDisplayOrder', () => {
  it('orders by createdAt descending, then name, then id', () => {
    const plots = [
      { id: 'b', name: 'Plot 2', createdAt: 100 },
      { id: 'a', name: 'Plot 1', createdAt: 200 },
    ];
    expect(sortPlotsForDisplay(plots).map((plot) => plot.id)).toEqual(['a', 'b']);
  });

  it('does not reorder when only metadata unrelated to sort key changes', () => {
    const left = { id: 'plot-a', name: 'Plot 1', createdAt: 500 };
    const right = { id: 'plot-b', name: 'Plot 3', createdAt: 400 };
    expect(comparePlotsForDisplay(left, right)).toBeLessThan(0);
    expect(comparePlotsForDisplay(left, right)).toBe(comparePlotsForDisplay(left, right));
  });
});

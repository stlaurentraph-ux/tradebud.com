import { describe, expect, it } from 'vitest';

import {
  findDuplicatePlotName,
  hasDuplicatePlotName,
  normalizePlotName,
  proposeUniqueDefaultPlotName,
} from './plotNameValidation';

const plots = [
  { id: 'f1-1', farmerId: 'f1', name: 'North Field' },
  { id: 'f1-2', farmerId: 'f1', name: 'Plot 2' },
  { id: 'f2-1', farmerId: 'f2', name: 'North Field' },
];

describe('plotNameValidation', () => {
  it('normalizes names for comparison', () => {
    expect(normalizePlotName('  North Field ')).toBe('north field');
  });

  it('detects duplicate names for the same farmer', () => {
    expect(
      hasDuplicatePlotName({
        plots,
        farmerId: 'f1',
        name: 'north field',
      }),
    ).toBe(true);
  });

  it('ignores plots owned by other farmers', () => {
    expect(
      findDuplicatePlotName({
        plots,
        farmerId: 'f2',
        name: 'Plot 2',
      }),
    ).toBeNull();
  });

  it('allows keeping the current name when renaming', () => {
    expect(
      hasDuplicatePlotName({
        plots,
        farmerId: 'f1',
        name: 'North Field',
        excludePlotId: 'f1-1',
      }),
    ).toBe(false);
  });

  it('blocks renaming into another plot name', () => {
    const duplicate = findDuplicatePlotName({
      plots,
      farmerId: 'f1',
      name: 'plot 2',
      excludePlotId: 'f1-1',
    });
    expect(duplicate?.id).toBe('f1-2');
  });

  it('proposes the first unused default plot name', () => {
    expect(proposeUniqueDefaultPlotName(plots, 'f1')).toBe('Plot 1');
    expect(
      proposeUniqueDefaultPlotName(
        [...plots, { id: 'f1-3', farmerId: 'f1', name: 'Plot 1' }],
        'f1',
      ),
    ).toBe('Plot 3');
  });
});

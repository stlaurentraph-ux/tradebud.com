import { describe, expect, it } from 'vitest';
import { plotIdsSharingMediaScope } from './plotMediaScope';

describe('plotIdsSharingMediaScope', () => {
  it('includes stale server client_plot_id with the same creation suffix', () => {
    const localPlotId = 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17-1781682185168';
    expect(
      plotIdsSharingMediaScope(localPlotId, [
        {
          id: '686b9ff6-acf7-40ff-9bb0-2d96f060bb78',
          client_plot_id: '66b5dafa-30be-4acb-a9c5-4e5c1ea22455-1781682185168',
        },
      ]),
    ).toEqual([
      localPlotId,
      '66b5dafa-30be-4acb-a9c5-4e5c1ea22455-1781682185168',
    ]);
  });
});

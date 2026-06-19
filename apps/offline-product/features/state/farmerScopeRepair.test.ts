import { describe, expect, it } from 'vitest';

import {
  plotsMismatchFarmer,
  resolveDominantFarmerIdFromPlots,
} from './farmerScopeRepair';

describe('farmerScopeRepair', () => {
  it('picks the farmer id that owns the most plots', () => {
    expect(
      resolveDominantFarmerIdFromPlots([
        { farmerId: 'a' },
        { farmerId: 'b' },
        { farmerId: 'a' },
      ]),
    ).toBe('a');
  });

  it('detects plot rows scoped to a different farmer id', () => {
    expect(
      plotsMismatchFarmer(
        [{ farmerId: 'local-1' }, { farmerId: 'local-1' }],
        'auth-2',
      ),
    ).toBe(true);
    expect(plotsMismatchFarmer([{ farmerId: 'auth-2' }], 'auth-2')).toBe(false);
  });
});

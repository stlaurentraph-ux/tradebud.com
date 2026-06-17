import { describe, expect, it } from 'vitest';
import {
  computePlotYieldAvailability,
  computePlotYieldCapKg,
  effectivePlotAreaHectares,
  sumDeliveredKgByPlot,
} from './plotYieldCapacity';

describe('plotYieldCapacity', () => {
  it('uses declared hectares for point plots without GPS area', () => {
    expect(
      effectivePlotAreaHectares({
        kind: 'point',
        areaHectares: 0,
        declaredAreaHectares: 3,
      }),
    ).toBe(3);
  });

  it('uses GPS hectares for mapped polygons even when declared is set', () => {
    expect(
      effectivePlotAreaHectares({
        kind: 'polygon',
        areaHectares: 2.4,
        declaredAreaHectares: 3,
      }),
    ).toBe(2.4);
  });

  it('falls back to GPS hectares when kind is omitted', () => {
    expect(effectivePlotAreaHectares({ areaHectares: 2.4 })).toBe(2.4);
  });

  it('computes cap from area', () => {
    expect(computePlotYieldCapKg(2)).toBe(3000);
    expect(computePlotYieldCapKg(0)).toBe(0);
  });

  it('subtracts delivered and reserved kg', () => {
    expect(
      computePlotYieldAvailability({
        areaHa: 2,
        deliveredKg: 500,
        reservedKg: 200,
      }),
    ).toEqual({ capKg: 3000, usedKg: 700, availableKg: 2300 });
  });

  it('aggregates voucher kg by plot id', () => {
    expect(
      sumDeliveredKgByPlot([
        { plot_id: 'p1', kg: 100 },
        { plotId: 'p1', weight_kg: 50 },
        { plot_id: 'p2', kg_delivered: 25 },
      ]),
    ).toEqual({ p1: 150, p2: 25 });
  });
});

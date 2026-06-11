import { describe, expect, it } from 'vitest';
import {
  RULE_SHIPMENT_WEIGHT_MISMATCH,
  sumBatchWeightKg,
  validateShipmentWeightGuardrail,
  weightsMatchWithinEpsilon,
} from './shipment-weight-guardrail';

describe('shipment-weight-guardrail', () => {
  it('sums batch voucher weights', () => {
    expect(
      sumBatchWeightKg([
        { total_weight_kg: 100 },
        { total_weight_kg: 100 },
        { total_weight_kg: null },
      ]),
    ).toBe(200);
  });

  it('allows exact match within epsilon', () => {
    expect(weightsMatchWithinEpsilon(1000, 1000.0005)).toBe(true);
    expect(validateShipmentWeightGuardrail(1000, 1000)).toEqual({ ok: true });
  });

  it('blocks over-declared shipment weight', () => {
    const result = validateShipmentWeightGuardrail(2000, 1000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(RULE_SHIPMENT_WEIGHT_MISMATCH);
      expect(result.message).toContain('2,000 kg');
      expect(result.message).toContain('1,000 kg');
    }
  });

  it('blocks under-declared shipment weight', () => {
    const result = validateShipmentWeightGuardrail(500, 1000);
    expect(result.ok).toBe(false);
  });
});

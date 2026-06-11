export const SHIPMENT_WEIGHT_EPSILON_KG = 0.001;
export const RULE_SHIPMENT_WEIGHT_MISMATCH = 'RULE-SHIPMENT-WEIGHT-MISMATCH';

export function sumBatchWeightKg(batches: Array<{ total_weight_kg?: number | null }>): number {
  return batches.reduce((sum, batch) => {
    const kg = Number(batch.total_weight_kg ?? 0);
    return sum + (Number.isFinite(kg) ? kg : 0);
  }, 0);
}

export function weightsMatchWithinEpsilon(
  declaredKg: number,
  coveredKg: number,
  epsilon = SHIPMENT_WEIGHT_EPSILON_KG,
): boolean {
  return Math.abs(declaredKg - coveredKg) <= epsilon;
}

function formatKg(kg: number): string {
  return `${kg.toLocaleString(undefined, { maximumFractionDigits: 3 })} kg`;
}

export function validateShipmentWeightGuardrail(
  declaredKg: number,
  coveredKg: number,
): { ok: true } | { ok: false; code: typeof RULE_SHIPMENT_WEIGHT_MISMATCH; message: string } {
  if (!Number.isFinite(declaredKg) || declaredKg <= 0) {
    return {
      ok: false,
      code: RULE_SHIPMENT_WEIGHT_MISMATCH,
      message: 'Declared shipment weight must be a positive number.',
    };
  }

  if (!Number.isFinite(coveredKg) || coveredKg <= 0) {
    return {
      ok: false,
      code: RULE_SHIPMENT_WEIGHT_MISMATCH,
      message: 'Selected batches have no verified harvest weight on their vouchers.',
    };
  }

  if (!weightsMatchWithinEpsilon(declaredKg, coveredKg)) {
    return {
      ok: false,
      code: RULE_SHIPMENT_WEIGHT_MISMATCH,
      message: `Declared shipment weight (${formatKg(declaredKg)}) must match batch lineage total (${formatKg(coveredKg)}). You cannot ship more coffee than the vouchers cover.`,
    };
  }

  return { ok: true };
}

export const BILLING_ORIGIN_SEAL_FEE_EUR = 1.0;
export const BILLING_DESTINATION_SUBMIT_FEE_EUR = 1.0;

export const BILLING_EVENT_ORIGIN_SEAL = 'SHIPMENT_FEE_ORIGIN_SEAL' as const;
export const BILLING_EVENT_DESTINATION_SUBMIT = 'SHIPMENT_FEE_DESTINATION_SUBMIT' as const;

export const BILLING_METER_STATUS_METERED = 'METERED' as const;
export const BILLING_METER_STATUS_WAIVED = 'WAIVED' as const;
export const BILLING_METER_STATUS_INVOICED = 'INVOICED' as const;

export const BILLING_INVOICE_STATUS_DRAFT = 'DRAFT' as const;
export const BILLING_INVOICE_STATUS_FINALIZED = 'FINALIZED' as const;
export const BILLING_INVOICE_STATUS_PAID = 'PAID' as const;
export const BILLING_INVOICE_STATUS_FAILED = 'FAILED' as const;

export function resolveBillingPeriod(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function resolvePreviousBillingPeriod(date = new Date()): string {
  const previousMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
  return resolveBillingPeriod(previousMonth);
}

export function buildOriginSealIdempotencyKey(shipmentHeaderId: string): string {
  return `${shipmentHeaderId}:origin_seal`;
}

export function buildDestinationSubmitIdempotencyKey(shipmentHeaderId: string): string {
  return `${shipmentHeaderId}:destination_submit`;
}

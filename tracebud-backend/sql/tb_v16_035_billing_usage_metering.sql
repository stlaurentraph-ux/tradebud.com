-- TB-V16-035: split shipment usage metering + monthly invoice rollups.
-- Origin seal €1.00 (SHIPMENT_FEE_ORIGIN_SEAL) + destination DDS submit €1.00 (SHIPMENT_FEE_DESTINATION_SUBMIT).
-- Usage is metered at event time; tenants are invoiced monthly (subscription + usage counts).

BEGIN;

CREATE TABLE IF NOT EXISTS billing_usage_meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'SHIPMENT_FEE_ORIGIN_SEAL',
      'SHIPMENT_FEE_DESTINATION_SUBMIT',
      'MODULE_SUBSCRIPTION',
      'MARKETPLACE_TRANSACTION_FEE',
      'SPONSOR_SEAT',
      'SHIPMENT_FEE_T2',
      'SHIPMENT_FEE_T3'
    )
  ),
  amount_eur NUMERIC(10, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  idempotency_key TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  shipment_header_id TEXT NULL,
  dds_record_id TEXT NULL,
  sponsor_tenant_id TEXT NULL,
  payment_method TEXT NOT NULL DEFAULT 'CARD' CHECK (
    payment_method IN ('CARD', 'CREDIT', 'SPONSOR_COVERED', 'WAIVED', 'EXTERNAL')
  ),
  meter_status TEXT NOT NULL DEFAULT 'METERED' CHECK (
    meter_status IN ('METERED', 'INVOICED', 'WAIVED', 'SPONSOR_COVERED', 'FAILED')
  ),
  billing_period TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_billing_usage_meters_tenant_period
  ON billing_usage_meters (tenant_id, billing_period, event_type);

CREATE INDEX IF NOT EXISTS idx_billing_usage_meters_shipment
  ON billing_usage_meters (shipment_header_id)
  WHERE shipment_header_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  subscription_amount_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  origin_seal_count INTEGER NOT NULL DEFAULT 0,
  origin_seal_amount_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  destination_submit_count INTEGER NOT NULL DEFAULT 0,
  destination_submit_amount_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  marketplace_fee_amount_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  invoice_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (
    invoice_status IN ('DRAFT', 'FINALIZED', 'PAID', 'FAILED', 'VOID')
  ),
  stripe_invoice_id TEXT NULL,
  finalized_at TIMESTAMPTZ NULL,
  paid_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, billing_period)
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_status
  ON billing_invoices (invoice_status, billing_period DESC);

CREATE TABLE IF NOT EXISTS shipment_billing_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_header_id TEXT NOT NULL,
  leg TEXT NOT NULL CHECK (leg IN ('origin_seal', 'destination_submit')),
  billing_tenant_id TEXT NOT NULL,
  billing_usage_meter_id UUID NOT NULL REFERENCES billing_usage_meters (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shipment_header_id, leg)
);

CREATE INDEX IF NOT EXISTS idx_shipment_billing_legs_tenant
  ON shipment_billing_legs (billing_tenant_id, created_at DESC);

COMMIT;

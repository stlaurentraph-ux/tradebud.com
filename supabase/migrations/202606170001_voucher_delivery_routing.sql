-- Mirrors tracebud-backend/sql/tb_v16_044_voucher_delivery_routing.sql

ALTER TABLE voucher
  ADD COLUMN IF NOT EXISTS intended_recipient_tenant_id TEXT,
  ADD COLUMN IF NOT EXISTS intended_recipient_email TEXT;

CREATE TABLE IF NOT EXISTS voucher_buyer_claims (
  voucher_id UUID NOT NULL REFERENCES voucher(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_by_user_id UUID,
  claim_source TEXT NOT NULL DEFAULT 'qr_lookup',
  PRIMARY KEY (voucher_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_voucher_intended_recipient_tenant
  ON voucher (intended_recipient_tenant_id)
  WHERE intended_recipient_tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_voucher_buyer_claims_tenant
  ON voucher_buyer_claims (tenant_id, claimed_at DESC);

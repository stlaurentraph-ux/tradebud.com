-- TB-V16-040: subscription band upgrade consent (Phase 2 gating).

BEGIN;

ALTER TABLE tenant_billing_subscription
  ADD COLUMN IF NOT EXISTS pending_billing_band TEXT NULL CHECK (
    pending_billing_band IS NULL OR pending_billing_band IN ('starter', 'growth', 'scale', 'enterprise')
  ),
  ADD COLUMN IF NOT EXISTS band_upgrade_accepted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS band_effective_from TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS enterprise_contract_active BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;

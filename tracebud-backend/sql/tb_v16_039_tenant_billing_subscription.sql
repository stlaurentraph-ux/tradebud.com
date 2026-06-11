-- TB-V16-039: per-tenant subscription plan for month-end invoice resolution.

BEGIN;

CREATE TABLE IF NOT EXISTS tenant_billing_subscription (
  tenant_id TEXT PRIMARY KEY,
  billing_band TEXT NOT NULL DEFAULT 'starter' CHECK (
    billing_band IN ('starter', 'growth', 'scale', 'enterprise')
  ),
  subscription_bundle TEXT NULL CHECK (
    subscription_bundle IS NULL OR subscription_bundle IN (
      'compliance_starter',
      'climate_starter',
      'sustainability_bundle',
      'due_diligence_bundle',
      'open_chain_bundle'
    )
  ),
  enabled_modules TEXT[] NOT NULL DEFAULT ARRAY['foundation', 'eudr']::TEXT[],
  subscription_billing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_customer_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_billing_subscription_band
  ON tenant_billing_subscription (billing_band);

COMMIT;

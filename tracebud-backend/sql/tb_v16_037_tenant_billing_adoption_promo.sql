-- TB-V16-037: adoption promo — first 3 months subscription-free + first origin seal / destination submit waived.

BEGIN;

CREATE TABLE IF NOT EXISTS tenant_billing_adoption_promo (
  tenant_id TEXT PRIMARY KEY,
  adoption_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscription_free_until TIMESTAMPTZ NOT NULL,
  first_origin_seal_waived_at TIMESTAMPTZ NULL,
  first_destination_submit_waived_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_billing_adoption_promo_free_until
  ON tenant_billing_adoption_promo (subscription_free_until);

COMMIT;

-- TB-V16-038: forfeiting subscription-free months when free first shipment is redeemed.

BEGIN;

ALTER TABLE tenant_billing_adoption_promo
  ADD COLUMN IF NOT EXISTS subscription_promo_forfeited_at TIMESTAMPTZ NULL;

COMMIT;

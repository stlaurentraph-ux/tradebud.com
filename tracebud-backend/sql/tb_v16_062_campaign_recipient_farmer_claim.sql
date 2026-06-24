-- TB-V16-062: Field-app farmer claim on campaign recipient invites.

BEGIN;

ALTER TABLE campaign_recipient_invites
  ADD COLUMN IF NOT EXISTS claimed_farmer_profile_id UUID NULL REFERENCES farmer_profile(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_recipient_invites_farmer_claim
  ON campaign_recipient_invites (claimed_farmer_profile_id)
  WHERE claimed_farmer_profile_id IS NOT NULL;

COMMIT;

-- TB-V16-065: ADR-012 P3 campaign invite claim tokens for WhatsApp/SMS landing.

BEGIN;

ALTER TABLE campaign_recipient_invites
  ADD COLUMN IF NOT EXISTS claim_token_hash TEXT NULL,
  ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_recipient_invites_claim_token_hash
  ON campaign_recipient_invites (claim_token_hash)
  WHERE claim_token_hash IS NOT NULL;

COMMIT;

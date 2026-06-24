-- TB-V16-064: ADR-012 P2 — contact-centric campaign targets and invite delivery metadata.

BEGIN;

ALTER TABLE request_campaigns
  ADD COLUMN IF NOT EXISTS target_contact_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS idx_request_campaigns_target_contact_ids_gin
  ON request_campaigns
  USING GIN (target_contact_ids);

ALTER TABLE campaign_recipient_invites
  ADD COLUMN IF NOT EXISTS contact_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS delivery_channel TEXT NULL DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS delivery_address TEXT NULL;

ALTER TABLE campaign_recipient_invites
  ALTER COLUMN recipient_email DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campaign_recipient_invites_delivery_channel_check'
  ) THEN
    ALTER TABLE campaign_recipient_invites
      ADD CONSTRAINT campaign_recipient_invites_delivery_channel_check
      CHECK (delivery_channel IN ('email', 'desk_only', 'whatsapp', 'sms'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_recipient_invites_campaign_contact
  ON campaign_recipient_invites (campaign_id, contact_id)
  WHERE contact_id IS NOT NULL;

COMMIT;

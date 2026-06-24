-- TB-V16-066 mirror: campaign fulfillment provenance (ADR-012 P5)

ALTER TABLE request_campaigns
  ADD COLUMN IF NOT EXISTS require_farmer_app_confirmation BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE request_campaign_recipient_decisions
  ADD COLUMN IF NOT EXISTS fulfillment_source TEXT NULL,
  ADD COLUMN IF NOT EXISTS contact_id TEXT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'request_campaign_recipient_decisions_fulfillment_source_check'
  ) THEN
    ALTER TABLE request_campaign_recipient_decisions
      ADD CONSTRAINT request_campaign_recipient_decisions_fulfillment_source_check
      CHECK (
        fulfillment_source IS NULL
        OR fulfillment_source IN (
          'farmer_app_email',
          'farmer_app_phone',
          'cooperative_on_behalf'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_request_campaign_recipient_decisions_contact
  ON request_campaign_recipient_decisions (campaign_id, contact_id)
  WHERE contact_id IS NOT NULL;

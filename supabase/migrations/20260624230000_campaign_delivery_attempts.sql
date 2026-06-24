-- TB-V16-067: ADR-012 P6 campaign delivery attempt audit trail.

CREATE TABLE IF NOT EXISTS campaign_delivery_attempts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT NOT NULL,
  sender_tenant_id TEXT NOT NULL,
  invite_id TEXT NULL,
  contact_id TEXT NULL,
  delivery_channel TEXT NOT NULL,
  delivery_address TEXT NULL,
  status TEXT NOT NULL,
  provider TEXT NULL,
  provider_message_id TEXT NULL,
  skip_reason TEXT NULL,
  claim_token_hash TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT campaign_delivery_attempts_channel_check
    CHECK (delivery_channel IN ('email', 'whatsapp', 'sms', 'desk_only')),
  CONSTRAINT campaign_delivery_attempts_status_check
    CHECK (status IN ('sent', 'skipped', 'failed', 'queued'))
);

CREATE INDEX IF NOT EXISTS idx_campaign_delivery_attempts_campaign
  ON campaign_delivery_attempts (campaign_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_delivery_attempts_contact
  ON campaign_delivery_attempts (campaign_id, contact_id)
  WHERE contact_id IS NOT NULL;

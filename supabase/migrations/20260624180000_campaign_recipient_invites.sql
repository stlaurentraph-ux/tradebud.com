-- Mirrors tracebud-backend/sql/tb_v16_061_campaign_recipient_invites.sql

CREATE TABLE IF NOT EXISTS campaign_recipient_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL REFERENCES request_campaigns(id) ON DELETE CASCADE,
  sender_tenant_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'claimed', 'skipped')),
  sent_at TIMESTAMPTZ NULL,
  claimed_tenant_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, recipient_email)
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipient_invites_email_status
  ON campaign_recipient_invites (lower(recipient_email), status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_recipient_invites_campaign
  ON campaign_recipient_invites (campaign_id, status);

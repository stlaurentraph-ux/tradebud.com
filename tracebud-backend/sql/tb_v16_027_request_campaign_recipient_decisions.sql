-- TB-V16-027: request campaign recipient decision ledger
-- Purpose: persist recipient Accept/Refuse decisions idempotently and safely.

BEGIN;

CREATE TABLE IF NOT EXISTS request_campaign_recipient_decisions (
  campaign_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('accept', 'refuse')),
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'email_cta',
  PRIMARY KEY (campaign_id, recipient_email),
  FOREIGN KEY (campaign_id) REFERENCES request_campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_request_campaign_recipient_decisions_campaign
ON request_campaign_recipient_decisions (campaign_id, decided_at DESC);

COMMIT;


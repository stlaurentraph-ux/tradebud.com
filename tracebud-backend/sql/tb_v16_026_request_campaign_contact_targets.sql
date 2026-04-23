-- TB-V16-026: request campaign contact target persistence
-- Purpose: persist recipient email targets so campaign send can dispatch real emails.

BEGIN;

ALTER TABLE request_campaigns
  ADD COLUMN IF NOT EXISTS target_contact_emails TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS idx_request_campaigns_target_contact_emails_gin
ON request_campaigns
USING GIN (target_contact_emails);

COMMIT;


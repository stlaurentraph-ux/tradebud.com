-- TB-V16-061: Pending campaign recipient invites when outreach email has no workspace tenant yet.
-- Post phase-1 schema split: request_campaigns lives in ops; invites stay in public (backend search_path).

BEGIN;

CREATE TABLE IF NOT EXISTS public.campaign_recipient_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL REFERENCES ops.request_campaigns(id) ON DELETE CASCADE,
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
  ON public.campaign_recipient_invites (lower(recipient_email), status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_recipient_invites_campaign
  ON public.campaign_recipient_invites (campaign_id, status);

COMMIT;

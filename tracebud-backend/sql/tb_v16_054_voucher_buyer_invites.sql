-- TB-V16-054: Pending buyer invites when farmer delivers to an email not yet on Tracebud dashboard.

BEGIN;

CREATE TABLE IF NOT EXISTS voucher_buyer_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL,
  farmer_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'claimed', 'skipped')),
  sent_at TIMESTAMPTZ NULL,
  claimed_tenant_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (voucher_id, recipient_email)
);

CREATE INDEX IF NOT EXISTS idx_voucher_buyer_invites_email_status
  ON voucher_buyer_invites (lower(recipient_email), status, created_at DESC);

COMMIT;

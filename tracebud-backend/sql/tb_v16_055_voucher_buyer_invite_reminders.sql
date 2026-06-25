-- TB-V16-055: Reminder nudges for unclaimed delivery buyer invites.

BEGIN;

ALTER TABLE voucher_buyer_invites
  ADD COLUMN IF NOT EXISTS reminder_nudge_sent_at TIMESTAMPTZ NULL;

ALTER TABLE voucher_buyer_invites
  ADD COLUMN IF NOT EXISTS reminder_nudge_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_voucher_buyer_invites_unclaimed_reminders
  ON voucher_buyer_invites (status, reminder_nudge_count, sent_at)
  WHERE status = 'sent';

COMMIT;

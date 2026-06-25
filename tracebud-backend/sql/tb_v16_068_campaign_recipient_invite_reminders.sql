-- TB-V16-068: Reminder nudges for unclaimed campaign recipient invites.

BEGIN;

ALTER TABLE campaign_recipient_invites
  ADD COLUMN IF NOT EXISTS reminder_nudge_sent_at TIMESTAMPTZ NULL;

ALTER TABLE campaign_recipient_invites
  ADD COLUMN IF NOT EXISTS reminder_nudge_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_campaign_recipient_invites_unclaimed_reminders
  ON campaign_recipient_invites (status, reminder_nudge_count, sent_at)
  WHERE status = 'sent';

COMMIT;

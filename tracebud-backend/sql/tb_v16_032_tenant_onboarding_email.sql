-- TB-V16-032: signup contact + onboarding transactional email state.
-- Purpose: welcome email after workspace setup (wizard step 2) and resume nudges for dropouts.

BEGIN;

CREATE TABLE IF NOT EXISTS tenant_signup_contacts (
  tenant_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NULL,
  signup_completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  welcome_email_sent_at TIMESTAMPTZ NULL,
  resume_nudge_sent_at TIMESTAMPTZ NULL,
  resume_nudge_count INTEGER NOT NULL DEFAULT 0 CHECK (resume_nudge_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_signup_contacts_resume_nudge
ON tenant_signup_contacts (welcome_email_sent_at, resume_nudge_count, signup_completed_at);

COMMIT;

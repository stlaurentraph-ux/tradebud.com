-- TB-V16-043: farmer welcome email after field-app account bootstrap
-- Tracks one welcome email per Supabase user (email / Google / Apple sign-up).

CREATE TABLE IF NOT EXISTS field_app_signup_contacts (
  user_id TEXT PRIMARY KEY,
  farmer_id UUID NULL REFERENCES farmer_profile(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NULL,
  welcome_email_sent_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_field_app_signup_contacts_welcome_sent
  ON field_app_signup_contacts (welcome_email_sent_at);

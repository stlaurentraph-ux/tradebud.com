-- ADR-006 Phase 3: bootstrap for a dedicated Tracebud GTM Supabase project.
-- Run once on the NEW project (not the product DB).
-- Includes: crm founder OS tables + gtm lead tables. Does NOT include crm_contacts (stays on product DB).

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS gtm;

COMMENT ON SCHEMA crm IS 'Founder OS pipeline, outreach, content calendar.';
COMMENT ON SCHEMA gtm IS 'Marketing/waitlist lead capture forms.';

-- ── crm: founder OS (from 20260413_001_founder_os_tables.sql) ─────────────────

CREATE TABLE IF NOT EXISTS crm.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text,
  company text NOT NULL,
  linkedin_url text UNIQUE,
  email text,
  website text,
  country text,
  commodity_focus text,
  company_size text,
  source text DEFAULT 'linkedin_search',
  stage text DEFAULT 'identified',
  connection_status text DEFAULT 'not_sent',
  connection_sent_date timestamptz,
  connection_accepted_date timestamptz,
  last_message_sent_date timestamptz,
  last_message_content text,
  last_reply_date timestamptz,
  last_reply_content text,
  next_follow_up_date timestamptz,
  response_status text,
  demo_booked boolean DEFAULT false,
  demo_date timestamptz,
  pilot_interest_score integer CHECK (pilot_interest_score >= 1 AND pilot_interest_score <= 5),
  owner text DEFAULT 'raph',
  notes text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.outreach_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stage text NOT NULL,
  channel text DEFAULT 'linkedin',
  content text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.outreach_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES crm.prospects(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  channel text,
  content text,
  metadata jsonb DEFAULT '{}'::jsonb,
  performed_by text DEFAULT 'raph',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.daily_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_date date NOT NULL,
  prospect_id uuid REFERENCES crm.prospects(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  priority text DEFAULT 'medium',
  reason text,
  suggested_template_id uuid REFERENCES crm.outreach_templates(id),
  suggested_template_content text,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.content_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source text,
  raw_notes text,
  pillar text,
  target_persona text,
  status text DEFAULT 'idea',
  priority integer DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_idea_id uuid REFERENCES crm.content_ideas(id) ON DELETE SET NULL,
  channel text NOT NULL,
  pillar text,
  format text,
  target_persona text,
  goal text,
  hook text,
  draft text,
  cta text,
  scheduled_at timestamptz,
  published_at timestamptz,
  published_url text,
  status text DEFAULT 'draft',
  review_status text DEFAULT 'draft',
  owner text DEFAULT 'raph',
  missed_reason text,
  repurpose_source_id uuid,
  performance_impressions integer,
  performance_engagements integer,
  performance_comments integer,
  performance_replies integer,
  performance_review_due_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.content_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type text NOT NULL,
  related_content_id uuid REFERENCES crm.content_calendar(id) ON DELETE CASCADE,
  due_date timestamptz,
  status text DEFAULT 'open',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.cadence_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_name text NOT NULL DEFAULT 'default',
  linkedin_posts_per_week integer DEFAULT 2,
  newsletter_per_month integer DEFAULT 2,
  default_post_days text[] DEFAULT ARRAY['tuesday', 'thursday'],
  default_post_time text DEFAULT '09:00',
  default_newsletter_day text DEFAULT 'wednesday',
  default_newsletter_time text DEFAULT '09:00',
  weekly_review_day text DEFAULT 'friday',
  weekly_review_time text DEFAULT '16:00',
  monthly_review_day integer DEFAULT 1,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── gtm: marketing lead tables ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gtm.waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  organisation text NOT NULL,
  role text NOT NULL,
  commodity text NOT NULL,
  producer_range text NOT NULL,
  source_page text NOT NULL DEFAULT '/',
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_signups_email_lower_idx
  ON gtm.waitlist_signups (lower(email));

CREATE TABLE IF NOT EXISTS gtm.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  looking_for text NOT NULL,
  volume text,
  message text,
  status text NOT NULL DEFAULT 'New'
);

CREATE TABLE IF NOT EXISTS gtm.exporter_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country_of_operation text NOT NULL,
  primary_commodities text NOT NULL,
  annual_export_volume text NOT NULL,
  sourcing_farmers_range text,
  current_eudr_challenges text,
  source_page text NOT NULL,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS gtm.importer_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  company_size text,
  hq_location text,
  primary_commodities text[] NOT NULL DEFAULT '{}'::text[],
  annual_import_volume text,
  origin_countries text,
  current_suppliers text,
  eudr_readiness text,
  csrd_required boolean NOT NULL DEFAULT false,
  specific_requirements text,
  source_page text NOT NULL,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS gtm.farmer_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country text,
  primary_commodity text,
  farm_size text,
  primary_goal text,
  biggest_challenge text,
  source_page text NOT NULL,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS gtm.cooperative_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  contact_name text NOT NULL,
  cooperative_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country text,
  primary_commodity text,
  cooperative_size text,
  primary_goal text,
  biggest_challenge text,
  source_page text NOT NULL,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS gtm.country_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  organization_name text NOT NULL,
  organization_type text,
  contact_name text NOT NULL,
  title text,
  email text NOT NULL,
  phone text,
  country text,
  commodities text[] NOT NULL DEFAULT '{}'::text[],
  registered_producers text,
  existing_systems text,
  current_challenges text,
  integration_needs text,
  data_standards text[] NOT NULL DEFAULT '{}'::text[],
  pilot_interest boolean NOT NULL DEFAULT false,
  additional_info text,
  source_page text NOT NULL,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ── RLS + grants ─────────────────────────────────────────────────────────────

ALTER TABLE crm.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.outreach_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.outreach_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.daily_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.content_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.cadence_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE gtm.waitlist_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm.cooperative_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm.country_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm.exporter_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm.farmer_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm.importer_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm.leads ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA crm, gtm TO postgres, service_role, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA crm, gtm TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA crm, gtm TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA crm, gtm TO anon, authenticated, service_role;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'prospects', 'outreach_templates', 'outreach_activity', 'daily_actions',
    'content_ideas', 'content_calendar', 'content_tasks', 'cadence_settings'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY crm_%I_postgrest_deny ON crm.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      t, t
    );
  END LOOP;
  FOREACH t IN ARRAY ARRAY[
    'waitlist_signups', 'cooperative_leads', 'country_leads',
    'exporter_leads', 'farmer_leads', 'importer_leads'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY gtm_%I_postgrest_deny ON gtm.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      t, t
    );
  END LOOP;
END $$;

CREATE POLICY leads_public_insert_guarded ON gtm.leads FOR INSERT TO public
WITH CHECK (
  char_length(btrim(first_name)) > 0 AND char_length(btrim(last_name)) > 0
  AND char_length(btrim(company)) > 0 AND char_length(btrim(looking_for)) > 0
  AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' AND status = 'New'
);

COMMIT;

-- After bootstrap: PATCH PostgREST exposed schemas to public,graphql_public,crm,gtm
-- Set SUPABASE_GTM_URL + SUPABASE_GTM_SERVICE_ROLE_KEY on marketing + dashboard apps.

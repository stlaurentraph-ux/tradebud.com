BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS prospects (
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

CREATE INDEX IF NOT EXISTS idx_prospects_stage ON prospects(stage);
CREATE INDEX IF NOT EXISTS idx_prospects_connection_status ON prospects(connection_status);
CREATE INDEX IF NOT EXISTS idx_prospects_next_follow_up_date ON prospects(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_prospects_demo_date ON prospects(demo_date);
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON prospects(created_at);
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);

CREATE TABLE IF NOT EXISTS outreach_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stage text NOT NULL,
  channel text DEFAULT 'linkedin',
  content text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outreach_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  channel text,
  content text,
  metadata jsonb DEFAULT '{}'::jsonb,
  performed_by text DEFAULT 'raph',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_activity_prospect_id ON outreach_activity(prospect_id);
CREATE INDEX IF NOT EXISTS idx_outreach_activity_created_at ON outreach_activity(created_at);

CREATE TABLE IF NOT EXISTS daily_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_date date NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  priority text DEFAULT 'medium',
  reason text,
  suggested_template_id uuid REFERENCES outreach_templates(id),
  suggested_template_content text,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_actions_action_date ON daily_actions(action_date);
CREATE INDEX IF NOT EXISTS idx_daily_actions_completed ON daily_actions(completed);

CREATE TABLE IF NOT EXISTS content_ideas (
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

CREATE TABLE IF NOT EXISTS content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_idea_id uuid REFERENCES content_ideas(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled_at ON content_calendar(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);

CREATE TABLE IF NOT EXISTS content_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type text NOT NULL,
  related_content_id uuid REFERENCES content_calendar(id) ON DELETE CASCADE,
  due_date timestamptz,
  status text DEFAULT 'open',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_tasks_due_date ON content_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_content_tasks_status ON content_tasks(status);

CREATE TABLE IF NOT EXISTS cadence_settings (
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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_prospects_updated_at ON prospects;
CREATE TRIGGER update_prospects_updated_at
BEFORE UPDATE ON prospects
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_ideas_updated_at ON content_ideas;
CREATE TRIGGER update_content_ideas_updated_at
BEFORE UPDATE ON content_ideas
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_calendar_updated_at ON content_calendar;
CREATE TRIGGER update_content_calendar_updated_at
BEFORE UPDATE ON content_calendar
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_tasks_updated_at ON content_tasks;
CREATE TRIGGER update_content_tasks_updated_at
BEFORE UPDATE ON content_tasks
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_cadence_settings_updated_at ON cadence_settings;
CREATE TRIGGER update_cadence_settings_updated_at
BEFORE UPDATE ON cadence_settings
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

COMMIT;

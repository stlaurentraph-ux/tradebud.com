BEGIN;

CREATE OR REPLACE FUNCTION daily_outreach_actions(target_date date)
RETURNS TABLE (
  prospect_id uuid,
  name text,
  company text,
  title text,
  linkedin_url text,
  stage text,
  action_type text,
  priority text,
  reason text,
  suggested_template_content text,
  days_since_last_action integer
)
LANGUAGE sql
AS $$
WITH latest_activity AS (
  SELECT
    oa.prospect_id,
    MAX(oa.created_at) AS latest_activity_at
  FROM outreach_activity oa
  GROUP BY oa.prospect_id
),
first_message_candidates AS (
  SELECT
    p.id AS prospect_id,
    p.name,
    p.company,
    p.title,
    p.linkedin_url,
    p.stage,
    'first_message'::text AS action_type,
    'high'::text AS priority,
    'Connected but no first message sent.'::text AS reason,
    (
      SELECT ot.content
      FROM outreach_templates ot
      WHERE ot.active = true
        AND ot.channel = 'linkedin'
        AND ot.stage = 'first_message'
      ORDER BY ot.created_at ASC
      LIMIT 1
    ) AS suggested_template_content,
    COALESCE((target_date - p.connection_accepted_date::date), 0)::integer AS days_since_last_action
  FROM prospects p
  WHERE p.stage = 'connected'
    AND p.last_message_sent_date IS NULL
),
follow_up_candidates AS (
  SELECT
    p.id AS prospect_id,
    p.name,
    p.company,
    p.title,
    p.linkedin_url,
    p.stage,
    'follow_up'::text AS action_type,
    'high'::text AS priority,
    'Last outbound message was more than 5 days ago and no reply since.'::text AS reason,
    (
      SELECT ot.content
      FROM outreach_templates ot
      WHERE ot.active = true
        AND ot.channel = 'linkedin'
        AND ot.stage = 'follow_up'
      ORDER BY ot.created_at ASC
      LIMIT 1
    ) AS suggested_template_content,
    (target_date - p.last_message_sent_date::date)::integer AS days_since_last_action
  FROM prospects p
  WHERE p.stage = 'message_sent'
    AND p.last_message_sent_date IS NOT NULL
    AND p.last_message_sent_date <= (target_date::timestamp - interval '5 days')
    AND (p.last_reply_date IS NULL OR p.last_reply_date < p.last_message_sent_date)
    AND p.stage NOT IN ('dead', 'not_interested')
),
demo_reminder_candidates AS (
  SELECT
    p.id AS prospect_id,
    p.name,
    p.company,
    p.title,
    p.linkedin_url,
    p.stage,
    'demo_reminder'::text AS action_type,
    'high'::text AS priority,
    'Demo scheduled for tomorrow.'::text AS reason,
    (
      SELECT ot.content
      FROM outreach_templates ot
      WHERE ot.active = true
        AND ot.channel = 'linkedin'
        AND ot.stage = 'demo_reminder'
      ORDER BY ot.created_at ASC
      LIMIT 1
    ) AS suggested_template_content,
    COALESCE((p.demo_date::date - target_date), 0)::integer AS days_since_last_action
  FROM prospects p
  WHERE p.demo_booked = true
    AND p.demo_date::date = (target_date + interval '1 day')::date
),
review_reply_candidates AS (
  SELECT
    p.id AS prospect_id,
    p.name,
    p.company,
    p.title,
    p.linkedin_url,
    p.stage,
    'review_reply'::text AS action_type,
    'high'::text AS priority,
    'Recent reply needs manual review.'::text AS reason,
    (
      SELECT ot.content
      FROM outreach_templates ot
      WHERE ot.active = true
        AND ot.stage = 'reply_response'
      ORDER BY ot.created_at ASC
      LIMIT 1
    ) AS suggested_template_content,
    (target_date - p.last_reply_date::date)::integer AS days_since_last_action
  FROM prospects p
  WHERE p.stage = 'replied'
    AND p.last_reply_date IS NOT NULL
    AND p.last_reply_date >= (target_date::timestamp - interval '2 days')
),
stale_lead_candidates AS (
  SELECT
    p.id AS prospect_id,
    p.name,
    p.company,
    p.title,
    p.linkedin_url,
    p.stage,
    'stale_lead'::text AS action_type,
    'medium'::text AS priority,
    'No meaningful activity for more than 14 days.'::text AS reason,
    (
      SELECT ot.content
      FROM outreach_templates ot
      WHERE ot.active = true
        AND ot.channel = 'linkedin'
        AND ot.stage = 'follow_up'
      ORDER BY ot.created_at ASC
      LIMIT 1
    ) AS suggested_template_content,
    (
      target_date - COALESCE(
        la.latest_activity_at::date,
        p.last_reply_date::date,
        p.last_message_sent_date::date,
        p.connection_accepted_date::date,
        p.connection_sent_date::date,
        p.created_at::date
      )
    )::integer AS days_since_last_action
  FROM prospects p
  LEFT JOIN latest_activity la ON la.prospect_id = p.id
  WHERE p.stage IN ('identified', 'connection_sent', 'connected', 'message_sent')
    AND (
      COALESCE(
        la.latest_activity_at,
        p.last_reply_date,
        p.last_message_sent_date,
        p.connection_accepted_date,
        p.connection_sent_date,
        p.updated_at,
        p.created_at
      ) <= (target_date::timestamp - interval '14 days')
    )
)
SELECT * FROM first_message_candidates
UNION ALL
SELECT * FROM follow_up_candidates
UNION ALL
SELECT * FROM demo_reminder_candidates
UNION ALL
SELECT * FROM review_reply_candidates
UNION ALL
SELECT * FROM stale_lead_candidates;
$$;

CREATE OR REPLACE FUNCTION generate_daily_actions(target_date date)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  inserted_count integer := 0;
BEGIN
  DELETE FROM daily_actions
  WHERE action_date = target_date;

  INSERT INTO daily_actions (
    action_date,
    prospect_id,
    action_type,
    priority,
    reason,
    suggested_template_content
  )
  SELECT
    target_date,
    d.prospect_id,
    d.action_type,
    d.priority,
    d.reason,
    d.suggested_template_content
  FROM daily_outreach_actions(target_date) d;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

CREATE OR REPLACE FUNCTION content_tasks_due(target_date date)
RETURNS TABLE (
  task_id uuid,
  task_type text,
  due_date timestamptz,
  status text,
  urgency text,
  note text,
  related_content_id uuid
)
LANGUAGE sql
AS $$
WITH open_tasks AS (
  SELECT
    ct.id AS task_id,
    ct.task_type,
    ct.due_date,
    ct.status,
    CASE
      WHEN ct.due_date IS NULL THEN 'medium'
      WHEN ct.due_date::date < target_date THEN 'high'
      WHEN ct.due_date::date <= (target_date + interval '2 day')::date THEN 'high'
      ELSE 'medium'
    END AS urgency,
    CASE
      WHEN ct.due_date IS NULL THEN 'Open task without due date.'
      WHEN ct.due_date::date < target_date THEN 'Task is overdue.'
      WHEN ct.due_date::date <= (target_date + interval '2 day')::date THEN 'Task due soon.'
      ELSE 'Open task.'
    END AS note,
    ct.related_content_id
  FROM content_tasks ct
  WHERE ct.status IN ('open', 'in_progress')
),
missed_content AS (
  SELECT
    gen_random_uuid() AS task_id,
    'schedule_post'::text AS task_type,
    cc.scheduled_at AS due_date,
    'open'::text AS status,
    'high'::text AS urgency,
    'Content item passed schedule time without being published.'::text AS note,
    cc.id AS related_content_id
  FROM content_calendar cc
  WHERE cc.scheduled_at IS NOT NULL
    AND cc.scheduled_at::date <= target_date
    AND cc.status <> 'published'
),
newsletter_due AS (
  SELECT
    gen_random_uuid() AS task_id,
    'write_newsletter'::text AS task_type,
    (target_date + interval '3 day')::timestamptz AS due_date,
    'open'::text AS status,
    'medium'::text AS urgency,
    'Newsletter window is due this week based on cadence.'::text AS note,
    NULL::uuid AS related_content_id
  FROM cadence_settings cs
  WHERE cs.active = true
    AND cs.newsletter_per_month >= 2
    AND EXTRACT(DOW FROM target_date::timestamp) BETWEEN 1 AND 5
  LIMIT 1
),
performance_reviews AS (
  SELECT
    gen_random_uuid() AS task_id,
    'analyze_performance'::text AS task_type,
    cc.performance_review_due_at AS due_date,
    'open'::text AS status,
    CASE
      WHEN cc.performance_review_due_at::date < target_date THEN 'high'
      ELSE 'medium'
    END AS urgency,
    'Published content is awaiting performance review.'::text AS note,
    cc.id AS related_content_id
  FROM content_calendar cc
  WHERE cc.status = 'published'
    AND cc.performance_review_due_at IS NOT NULL
    AND cc.performance_review_due_at::date <= (target_date + interval '7 day')::date
)
SELECT * FROM open_tasks
UNION ALL
SELECT * FROM missed_content
UNION ALL
SELECT * FROM newsletter_due
UNION ALL
SELECT * FROM performance_reviews;
$$;

CREATE OR REPLACE FUNCTION generate_content_tasks(target_date date)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  post_count_next_14 integer := 0;
  newsletter_count_next_14 integer := 0;
  inserted_count integer := 0;
  inserted_delta integer := 0;
  cadence_posts integer := 2;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE cc.channel = 'linkedin_post'),
    COUNT(*) FILTER (WHERE cc.channel = 'linkedin_newsletter')
  INTO post_count_next_14, newsletter_count_next_14
  FROM content_calendar cc
  WHERE cc.scheduled_at::date BETWEEN target_date AND (target_date + interval '14 day')::date;

  SELECT COALESCE(cs.linkedin_posts_per_week, 2)
  INTO cadence_posts
  FROM cadence_settings cs
  WHERE cs.active = true
  ORDER BY cs.updated_at DESC
  LIMIT 1;

  IF cadence_posts > 3 THEN
    cadence_posts := 3;
  END IF;

  IF post_count_next_14 < cadence_posts * 2 THEN
    INSERT INTO content_tasks (task_type, due_date, status, notes)
    VALUES (
      'write_post',
      (target_date + interval '2 day')::timestamptz,
      'open',
      'Pipeline has missing post slots for the next 14 days.'
    );
    inserted_count := inserted_count + 1;
  END IF;

  IF newsletter_count_next_14 < 1 THEN
    INSERT INTO content_tasks (task_type, due_date, status, notes)
    VALUES (
      'write_newsletter',
      (target_date + interval '5 day')::timestamptz,
      'open',
      'No newsletter scheduled in the next 14 days.'
    );
    inserted_count := inserted_count + 1;
  END IF;

  INSERT INTO content_tasks (task_type, related_content_id, due_date, status, notes)
  SELECT
    'review_post',
    cc.id,
    COALESCE(cc.scheduled_at, (target_date + interval '2 day')::timestamptz),
    'open',
    'Draft is pending review before scheduling.'
  FROM content_calendar cc
  WHERE cc.status = 'draft'
    AND cc.review_status IN ('draft', 'needs_review')
    AND cc.scheduled_at IS NOT NULL
    AND cc.scheduled_at::date BETWEEN target_date AND (target_date + interval '14 day')::date
    AND NOT EXISTS (
      SELECT 1
      FROM content_tasks ct
      WHERE ct.related_content_id = cc.id
        AND ct.task_type = 'review_post'
        AND ct.status IN ('open', 'in_progress')
    );
  GET DIAGNOSTICS inserted_delta = ROW_COUNT;
  inserted_count := inserted_count + inserted_delta;

  INSERT INTO content_tasks (task_type, related_content_id, due_date, status, notes)
  SELECT
    'analyze_performance',
    cc.id,
    COALESCE(cc.performance_review_due_at, (cc.published_at + interval '7 day')),
    'open',
    'Published post needs performance review.'
  FROM content_calendar cc
  WHERE cc.status = 'published'
    AND cc.published_at IS NOT NULL
    AND cc.published_at <= (target_date::timestamp - interval '7 day')
    AND NOT EXISTS (
      SELECT 1
      FROM content_tasks ct
      WHERE ct.related_content_id = cc.id
        AND ct.task_type = 'analyze_performance'
        AND ct.status IN ('open', 'in_progress')
    );
  GET DIAGNOSTICS inserted_delta = ROW_COUNT;
  inserted_count := inserted_count + inserted_delta;

  INSERT INTO content_tasks (task_type, related_content_id, due_date, status, notes)
  SELECT
    'schedule_post',
    cc.id,
    cc.scheduled_at,
    'missed',
    'Content missed its scheduled publication window.'
  FROM content_calendar cc
  WHERE cc.scheduled_at IS NOT NULL
    AND cc.scheduled_at < now()
    AND cc.status <> 'published'
    AND NOT EXISTS (
      SELECT 1
      FROM content_tasks ct
      WHERE ct.related_content_id = cc.id
        AND ct.task_type = 'schedule_post'
        AND ct.status = 'missed'
    );
  GET DIAGNOSTICS inserted_delta = ROW_COUNT;
  inserted_count := inserted_count + inserted_delta;

  INSERT INTO content_tasks (task_type, due_date, status, notes)
  SELECT
    'write_post',
    (target_date + interval '1 day')::timestamptz,
    'open',
    'Underused pillar warning: EUDR / compliance reality has low representation in last 14 days.'
  WHERE (
    SELECT COUNT(*)
    FROM content_calendar cc
    WHERE cc.published_at::date BETWEEN (target_date - interval '14 day')::date AND target_date
      AND cc.pillar = 'eudr'
  ) = 0
  AND NOT EXISTS (
    SELECT 1 FROM content_tasks ct
    WHERE ct.task_type = 'write_post'
      AND ct.notes ILIKE 'Underused pillar warning:%'
      AND ct.created_at::date = target_date
  );
  GET DIAGNOSTICS inserted_delta = ROW_COUNT;
  inserted_count := inserted_count + inserted_delta;

  RETURN inserted_count;
END;
$$;

COMMIT;

BEGIN;

INSERT INTO outreach_templates (name, stage, channel, content, active)
VALUES
  (
    'Connection request - coffee importer',
    'connection_request',
    'linkedin',
    'Hi {{name}} - I am building Tracebud for EUDR traceability in coffee supply chains. We help teams go from farm polygons to TRACES-ready evidence with less manual work. Open to connecting?',
    true
  ),
  (
    'Connection request - cooperative leader',
    'connection_request',
    'linkedin',
    'Hi {{name}} - we are working with cooperatives on practical EUDR readiness, especially farm mapping and evidence capture. Would be glad to connect and exchange notes.',
    true
  ),
  (
    'Connection request - referral intro',
    'connection_request',
    'linkedin',
    'Hi {{name}} - {{referrer}} suggested we connect. I am building Tracebud to simplify EUDR workflows from plot geometry to TRACES NT submission. Happy to connect if relevant.',
    true
  ),
  (
    'First message - pilot exploration',
    'first_message',
    'linkedin',
    'Thanks for connecting, {{name}}. Quick context: Tracebud helps coffee teams move from farm polygon capture to TRACES NT-aligned submission with audit-ready evidence. If useful, I can share a short 15-minute walkthrough.',
    true
  ),
  (
    'First message - importer use case',
    'first_message',
    'linkedin',
    'Appreciate the connection. We are focused on reducing EUDR operational friction for importers and their upstream partners. Happy to share how we handle geometry, evidence packaging, and submission readiness in one flow.',
    true
  ),
  (
    'Follow-up - light check in',
    'follow_up',
    'linkedin',
    'Hi {{name}} - just checking if EUDR workflow simplification is currently a priority on your side. If helpful, I can send a concise overview tailored to {{company}}.',
    true
  ),
  (
    'Follow-up - demo nudge',
    'follow_up',
    'linkedin',
    'Circling back in case this was buried. We are running pilot discussions around coffee traceability from farm polygon to TRACES-ready outputs. Would a short intro call next week be useful?',
    true
  ),
  (
    'Demo reminder',
    'demo_reminder',
    'linkedin',
    'Looking forward to our demo tomorrow. I will keep it practical: current process, bottlenecks, and where Tracebud can reduce compliance overhead quickly.',
    true
  ),
  (
    'Reply response - positive',
    'reply_response',
    'internal_ai',
    'Draft a concise response for a positive pilot-interest reply. Keep tone credible and practical, confirm their context, propose 2 scheduling options, and ask one clarifying question about commodity flow.',
    true
  ),
  (
    'Weekly idea generator',
    'internal_weekly_idea_generator',
    'internal_ai',
    'Generate 10 content ideas for Tracebud this week. Use the three pillars only: EUDR/compliance reality, founder building in public, and ethical supply-chain insight from the field. For each idea include hook, target persona, and CTA.',
    true
  ),
  (
    'LinkedIn post drafter',
    'internal_linkedin_post_drafter',
    'internal_ai',
    'Draft a LinkedIn post for {{pillar}} targeting {{persona}}. Keep it practical, specific, and non-hype. Structure: strong hook, concrete lesson, one proof detail, and clear CTA. Max 220 words.',
    true
  ),
  (
    'Newsletter drafter',
    'internal_newsletter_drafter',
    'internal_ai',
    'Draft a LinkedIn newsletter issue around {{topic}}. Include title options, opening context, 3 practical sections, and one opinionated founder takeaway. Keep it useful for EUDR operators.',
    true
  ),
  (
    'Content reviewer',
    'internal_content_reviewer',
    'internal_ai',
    'Review this draft for clarity, credibility, and signal quality. Flag weak claims, remove hype language, and suggest tighter phrasing. Return final revised draft plus 3 improvement notes.',
    true
  ),
  (
    'Monthly performance analyst',
    'internal_monthly_performance_analyst',
    'internal_ai',
    'Analyze last month content performance by pillar and format. Identify highest-performing pattern, weakest area, and next-month content focus. Provide 5 concrete actions.',
    true
  ),
  (
    'Weekly accountability audit',
    'internal_weekly_accountability_audit',
    'internal_ai',
    'Audit founder content discipline for the last 7 days: planned vs published, missed tasks, overdue reviews, and risk to next week cadence. Output clear corrective actions.',
    true
  )
ON CONFLICT DO NOTHING;

INSERT INTO cadence_settings (
  cadence_name,
  linkedin_posts_per_week,
  newsletter_per_month,
  default_post_days,
  default_post_time,
  default_newsletter_day,
  default_newsletter_time,
  weekly_review_day,
  weekly_review_time,
  monthly_review_day,
  active
)
VALUES (
  'default',
  2,
  2,
  ARRAY['tuesday', 'thursday'],
  '09:00',
  'wednesday',
  '09:00',
  'friday',
  '16:00',
  1,
  true
)
ON CONFLICT DO NOTHING;

COMMIT;

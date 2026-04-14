# Founder OS n8n Workflows

This folder contains workflow specs for the Tracebud Founder OS automation layer.

## Workflows

- `workflow-a-daily-outreach-intelligence.json`
- `workflow-b-website-form-intake.json`
- `workflow-c-weekly-content-planning.json`
- `workflow-d-content-accountability-check.json`
- `workflow-e-monthly-performance-review.json`
- `workflow-f-missed-schedule-alert.json`

## Setup

1. Import each JSON into n8n.
2. Configure credentials for:
   - Supabase (REST or Postgres)
   - Email provider (SMTP/Gmail/Resend)
   - Slack (optional)
   - Notion (optional)
3. Set workflow timezone to `Europe/Oslo`.
4. Update environment variables used in HTTP/Postgres nodes:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FOUNDER_EMAIL_TO`
   - `SLACK_WEBHOOK_URL` (optional)
   - `NOTION_DATABASE_ID` (optional)

## Safety Constraints

- These workflows do not perform LinkedIn actions.
- They only generate reminders, summaries, and planning intelligence.
- LinkedIn outreach execution remains manual.

## Suggested Validation

- Run each workflow manually once after import.
- Confirm Supabase function calls succeed:
  - `generate_daily_actions(current_date)`
  - `generate_content_tasks(current_date)`
- Confirm summary output format is concise and actionable.

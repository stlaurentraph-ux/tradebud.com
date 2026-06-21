# Founder OS n8n Workflows

This folder contains workflow specs for the Tracebud Founder OS automation layer.

## Workflows

- `workflow-a-daily-outreach-intelligence.json`
- `workflow-b-website-form-intake.json` — **activation:** [workflow-b-activation.md](./workflow-b-activation.md) (slice 2.O.1)
- `workflow-c-weekly-content-planning.json`
- `workflow-d-content-accountability-check.json`
- `workflow-e-monthly-performance-review.json`
- `workflow-f-missed-schedule-alert.json` — **activation:** [workflow-f-activation.md](./workflow-f-activation.md) (slice 2.O.2)

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
- **Workflow B (website form intake):** run `npm run n8n:workflow-b:assert` before merge; follow [workflow-b-activation.md](./workflow-b-activation.md) when enabling n8n.
- **Workflow F (missed schedule alert):** run `npm run n8n:workflow-f:assert` before merge; follow [workflow-f-activation.md](./workflow-f-activation.md) when enabling n8n.

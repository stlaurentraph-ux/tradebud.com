# Supabase Founder OS Setup

This folder contains SQL migrations and seed data for the Tracebud Founder OS:

- Outreach CRM
- Daily outreach intelligence
- Content cadence management

## Files

- `migrations/20260413_001_founder_os_tables.sql`: tables, indexes, and `updated_at` triggers
- `migrations/20260413_002_founder_os_functions.sql`: reporting/generator SQL functions
- `seeds/20260413_001_founder_os_seed.sql`: outreach templates, internal AI prompts, and cadence defaults

## Apply Order

Run scripts in this order:

1. `migrations/20260413_001_founder_os_tables.sql`
2. `migrations/20260413_002_founder_os_functions.sql`
3. `seeds/20260413_001_founder_os_seed.sql`

You can run this in Supabase SQL Editor or through your SQL migration runner.

## Verification Queries

```sql
-- Tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'prospects',
    'outreach_templates',
    'outreach_activity',
    'daily_actions',
    'content_ideas',
    'content_calendar',
    'content_tasks',
    'cadence_settings'
  )
ORDER BY table_name;

-- Seed template check
SELECT stage, channel, count(*)
FROM outreach_templates
GROUP BY stage, channel
ORDER BY stage, channel;

-- Function smoke test
SELECT generate_daily_actions(current_date);
SELECT * FROM daily_outreach_actions(current_date);
SELECT * FROM content_tasks_due(current_date);
SELECT generate_content_tasks(current_date);
```

## Notes

- This setup is intentionally additive and does not modify existing marketing lead tables.
- LinkedIn action automation is intentionally out of scope; this schema automates intelligence and planning only.

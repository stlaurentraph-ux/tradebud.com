# Workflow F — Missed schedule alert (slice 2.O.2)

Daily n8n cron workflow that notifies the founder when **scheduled content is overdue** or **high-urgency content tasks** are open. Uses the same Founder OS SQL helpers as workflow C/D — do not fork detection rules in n8n expressions.

## Canonical detection (live in Supabase)

| Source | Logic |
|--------|--------|
| `content_tasks_due(target_date)` | Returns open/overdue tasks, missed calendar rows, newsletter windows, performance reviews |
| `missed_content` CTE inside that function | `content_calendar.scheduled_at <= target_date` AND `status <> 'published'` |
| `crm.content_calendar` | `scheduled_at`, `status`, `channel`, `hook`, `owner`, `missed_reason` |
| `crm.content_tasks` | `task_type`, `due_date`, `status`, `related_content_id` |

Schema: tables live in **`crm`** schema after phase-1 split (`supabase/migrations/20260620120000_phase1_schema_split.sql`).

Functions: `supabase/migrations/20260413_002_founder_os_functions.sql`

## When to activate workflow-f

Enable when Founder OS content calendar is in active use and you want a **daily 17:00 Europe/Oslo** ping instead of manually checking the dashboard.

**Skip activation** if:

- Content calendar is empty / not yet adopted
- Workflow D (Monday accountability) already covers your cadence

## Recommended activation pattern

1. Import `workflow-f-missed-schedule-alert.json` into n8n (spec — rebuild nodes manually or use as checklist).
2. Cron trigger: `0 17 * * *`, timezone **Europe/Oslo**.
3. Supabase node: `POST /rest/v1/rpc/content_tasks_due` with body `{ "target_date": "{{ $today }}" }` (or n8n date expression).
4. Filter RPC rows where `urgency = high` **or** merge with direct query on `crm.content_calendar` for unpublished past `scheduled_at`.
5. If merged list is empty → **stop** (no notification).
6. Optional: call `generate_content_tasks(current_date)` earlier in the chain if task rows may be stale.
7. Send founder summary via email (`FOUNDER_EMAIL_TO`) and/or Slack (`SLACK_WEBHOOK_URL`).
8. Optional: write `missed_reason` on `content_calendar` or append `content_tasks` — keep idempotent (one alert per item per day).

### Sample alert body

```
Founder OS — 2 missed schedule items (2026-06-21)

1. linkedin_post — "EUDR plot capture under canopy" — scheduled 2026-06-21 09:00 — status: draft
2. schedule_post task — overdue — related calendar id 00000000-...
```

## Environment variables (n8n)

Same as other Founder OS workflows — configure on the n8n host, not in GitHub:

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | yes | CRM project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | RPC + table reads on `crm` schema |
| `FOUNDER_EMAIL_TO` | yes (email mode) | Alert recipient |
| `SLACK_WEBHOOK_URL` | optional | Slack summary |
| `NOTION_DATABASE_ID` | optional | Log missed items |

See `product-os/04-quality/ci-secrets-and-fixtures.md`.

## Manual validation checklist

Run after n8n workflow is active:

- [ ] `npm run n8n:workflow-f:assert` passes in CI
- [ ] Seed a `crm.content_calendar` row with `scheduled_at` in the past and `status = draft`
- [ ] Run workflow manually — alert lists the row
- [ ] Mark row `published` — next run produces no alert
- [ ] Re-run same day — idempotent (no duplicate spam if dedupe wired)

## Repo guard

CI runs `npm run n8n:workflow-f:assert` to ensure:

- Workflow spec JSON matches cron schedule and Supabase RPC contract
- Activation runbook is present
- `content_tasks_due` migration still contains missed-content detection

## Rollback

Disable n8n workflow. Founder OS tables and dashboard remain unchanged — alerts stop only.

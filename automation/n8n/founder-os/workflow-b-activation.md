# Workflow B — Website form intake (slice 2.O.1)

Optional n8n workflow for founder notifications when marketing forms submit. **CRM prospect rows are already created by the marketing app** — do not treat n8n as the primary intake path unless you deliberately run notification-only mode.

## Canonical pipeline (live today)

| Form | API | GTM table | CRM sync |
|------|-----|-----------|----------|
| Segment lead forms | `POST /api/leads` | `*_leads` per form type | `syncLeadToProspects` → `prospects` + `outreach_activity` |
| Waitlist dialog | `POST /api/waitlist` | `waitlist_signups` | `syncWaitlistToProspects` → `prospects` + `outreach_activity` |

Mapper: `apps/marketing/lib/founder-os-mapper.ts`  
Sync: `apps/marketing/lib/prospect-sync.ts`

Expected CRM fields after sync:

- `prospects.source`: `website_form`, `website_pilot_form`, or `website_waitlist`
- `prospects.stage`: `identified` (or `pilot` for pilot forms)
- `outreach_activity.activity_type`: `identified`
- `outreach_activity.channel`: `website`

## When to activate n8n workflow-b

Use n8n when you want **extra** automation beyond in-app sync:

- Slack/Notion founder ping on high-intent pilot leads
- Email routing to a different inbox than Resend team notifications
- Enrichment or tagging before manual outreach

**Do not** wire n8n to re-insert prospects if marketing API sync is enabled — that creates duplicate rows.

## Recommended activation pattern (notification-only)

1. Import `workflow-b-website-form-intake.json` into n8n (spec — rebuild nodes manually or use as checklist).
2. Create webhook trigger at path `/founder-os/website-lead-intake`.
3. Add validation node against `payloadContract` in the JSON spec.
4. Query Supabase `prospects` by email; exit early if row exists and notification already sent.
5. Send founder notification (email/Slack) — **skip** prospect insert nodes.
6. Set timezone `Europe/Oslo`.

### Alternative: Supabase Database Webhook

Instead of marketing → n8n HTTP, attach a Supabase webhook on `prospects` `INSERT` where `source` LIKE `website%`. Map row to n8n notification payload. This avoids duplicate HTTP calls from marketing.

## Environment variables (n8n)

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | yes | CRM project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Read prospects for idempotency checks |
| `FOUNDER_EMAIL_TO` | yes (email mode) | Notification recipient |
| `SLACK_WEBHOOK_URL` | optional | Slack summary |
| `NOTION_DATABASE_ID` | optional | Task logging |

Document values in GitHub/Vercel only — never commit secrets. See `product-os/04-quality/ci-secrets-and-fixtures.md`.

## Manual validation checklist

Run after n8n workflow is active:

- [ ] `npm run n8n:workflow-b:assert` passes in CI (repo contract guard)
- [ ] Submit test lead on staging `/en/exporters` — confirm `prospects` row via Founder OS or Supabase
- [ ] Confirm n8n execution log shows notification (if wired) without duplicate prospect insert
- [ ] Re-submit same email — idempotent (no duplicate prospect, no duplicate alert spam)
- [ ] Waitlist dialog submit creates `source=website_waitlist` prospect

Sample webhook body for manual n8n test (see `samplePayload` in workflow JSON):

```json
{
  "email": "founder@example.com",
  "name": "Alex Founder",
  "formType": "exporter",
  "sourcePage": "/en/exporters",
  "company": "Example Exports AS",
  "country": "NO"
}
```

## Repo guard

CI runs `npm run n8n:workflow-b:assert` to ensure:

- Workflow spec JSON matches marketing mapper constants
- Lead API route still calls `syncLeadToProspects`
- Guardrails text remains present

## Rollback

Disable n8n workflow. Marketing forms continue working — GTM tables, email, and CRM sync are unaffected.

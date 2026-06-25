# Tracebud — Onboarding Transactional Email Templates

Production sends email from `src/launch/onboarding-email.service.ts` (Resend on Railway).
The Supabase confirm template is pasted directly into the Supabase Dashboard and is **not** sent via Resend.

---

## Sequence

| ID       | Trigger                                          | Subject                                              |
|----------|--------------------------------------------------|------------------------------------------------------|
| A        | Workspace setup saved (wizard step 2)            | Welcome to Tracebud — your workspace is ready        |
| D        | Farmer delivery to unknown dashboard email       | {{producerLabel}} shared a delivery record with you  |
| D2       | Cron: invite +72h, delivery unclaimed             | Reminder: delivery from {{producerLabel}} is still waiting |
| D3       | Cron: +96h after D2 (max 2 reminders total)      | Last reminder: delivery from {{producerLabel}} is waiting |
| E        | Campaign evidence request to cold recipient      | {{senderOrgLabel}} sent you a compliance request on Tracebud |
| E2       | Cron: invite +72h, campaign unclaimed            | Reminder: a compliance request is still waiting |
| E3       | Cron: +96h after E2 (max 2 reminders total)      | Last reminder: respond to your Tracebud request |
| B        | Cron: signup +24 h, workspace incomplete         | Finish setting up your Tracebud workspace            |
| C        | Cron: +48 h after B (max 2 nudges total)         | Reminder: your Tracebud workspace is almost ready    |
| Supabase | Supabase Auth confirm signup                     | Confirm your Tracebud account                        |

---

## File map

```
email-templates/
  html/
    _layout.html               Shared header + footer snippet (reference / copy-paste)
    welcome.html               Email A — Welcome
    delivery-buyer-invite.html Email D — Delivery buyer invite (cold recipient)
    delivery-buyer-invite-reminder.html Email D2 — Unclaimed delivery reminder #1
    delivery-buyer-invite-reminder-final.html Email D3 — Final unclaimed reminder
    campaign-request-invite.html Email E — Campaign request invite (cold recipient)
    campaign-request-invite-reminder.html Email E2 — Unclaimed campaign reminder #1
    campaign-request-invite-reminder-final.html Email E3 — Final unclaimed campaign reminder
    resume-nudge-first.html    Email B — Resume nudge #1
    resume-nudge-final.html    Email C — Final reminder
    supabase-confirm-email.html Bonus — Supabase Auth confirm (paste into Supabase Dashboard)
  text/
    welcome.txt                Email A plain text
    delivery-buyer-invite.txt  Email D plain text
    delivery-buyer-invite-reminder.txt  Email D2 plain text
    delivery-buyer-invite-reminder-final.txt  Email D3 plain text
    campaign-request-invite.txt  Email E plain text
    campaign-request-invite-reminder.txt  Email E2 plain text
    campaign-request-invite-reminder-final.txt  Email E3 plain text
    resume-nudge-first.txt     Email B plain text
    resume-nudge-final.txt     Email C plain text
  DESIGN_TOKENS.md             Full color, type, spacing, and merge-tag reference
  README.md                    This file
```

---

## Merge tags

| Tag                      | Emails  | Value                                                |
|--------------------------|---------|------------------------------------------------------|
| `{{firstName}}`          | A, B, C | Recipient first name                                 |
| `{{organizationName}}`   | A       | Organization name from wizard                        |
| `{{country}}`            | A       | Country of operation                                 |
| `{{roleLabel}}`          | A       | Importer / Exporter / Compliance manager / etc.      |
| `{{loginUrl}}`           | A       | `https://dashboard.tracebud.com/login`               |
| `{{resumeUrl}}`          | B, C    | Magic link → `/create-account?resume=workspace`      |
| `{{year}}`               | A, B, C | Current year (e.g. 2026)                             |
| `{{ .ConfirmationURL }}` | Supabase| Injected by Supabase Auth (Go template syntax)       |

---

## Production integration (NestJS)

`OnboardingEmailService` loads these files at runtime via `src/launch/onboarding-email.templates.ts`.

- **Welcome** → after wizard step 2 (`saveWorkspaceSetup`)
- **Delivery buyer invite** → farmer harvest with unknown buyer email (`delivery-buyer-invite.ts`)
- **Delivery invite reminders D2/D3** → cron `POST /api/v1/launch/delivery-invites/remind-unclaimed`
- **Campaign request invite** → evidence request dispatch (`campaign-request-email.ts`)
- **Campaign invite reminders E2/E3** → cron `POST /api/v1/launch/campaign-invites/remind-unclaimed`
- **Resume #1 / #2** → cron `POST /api/v1/launch/onboarding/remind-incomplete` (second send uses `resume-nudge-final.html`)

Docker/Railway must include the `email-templates/` folder (see `Dockerfile`).

### Merge tags (filled in code)

| Tag | Welcome | Resume B/C |
|-----|---------|------------|
| `{{firstName}}` | yes | yes |
| `{{organizationName}}` | yes | — |
| `{{country}}` | yes | — |
| `{{roleLabel}}` | yes | — |
| `{{loginUrl}}` | yes | — |
| `{{resumeUrl}}` | — | yes (magic link) |
| `{{unsubscribeUrl}}` | yes | yes (`/settings` or `TRACEBUD_ONBOARDING_UNSUBSCRIBE_URL`) |
| `{{year}}` | yes | yes |

HTML values are HTML-escaped; URLs in `href` attributes use escaped URLs.

**Supabase confirm** (`html/supabase-confirm-email.html`) is still pasted manually into Supabase Dashboard (uses `{{ .ConfirmationURL }}`).

### Supabase Dashboard preview (broken images?)

The Studio **Preview** pane runs in a sandboxed iframe. Common failures:

| Issue | Fix |
|-------|-----|
| Logo missing | Use the committed template: logo is a **~16 KB embedded data URI**, not `tracebud-logo.png` (879 KB). |
| Hero missing | Template uses **jsDelivr** from `main` until `www.tracebud.com` deploy is updated; re-paste after pulling latest `supabase-confirm-email.html`. |
| Preview still empty | Send a real **test signup** — many clients render images even when Studio preview does not. |

After editing the logo PNG, run `node tracebud-backend/email-templates/scripts/embed-supabase-logo.mjs` and paste the HTML again.

---

## Brand tokens quick reference

See `DESIGN_TOKENS.md` for the full table. Key values:

| Token            | Hex       |
|------------------|-----------|
| Forest canopy    | `#064E3B` |
| Data emerald     | `#10B981` |
| CTA green        | `#16A34A` |
| Resume blue      | `#1D4ED8` |
| Body text        | `#022C22` |
| Muted footer     | `#64748B` |
| Page background  | `#F9FAFB` |
| Card surface     | `#FFFFFF` |
| Border           | `#E5E7EB` |

Logo URL: `https://dashboard.tracebud.com/tracebud-logo-v6.png` (height 40 px)

---

## v0 workflow

1. Branch: `feat/onboarding-email-templates`
2. Templates generated and committed here by v0.
3. Open PR into `main`, then port finalized HTML into `onboarding-email.service.ts`.
4. For the Supabase confirm email, paste `html/supabase-confirm-email.html` into:
   Supabase Dashboard → Authentication → Email Templates → Confirm signup.

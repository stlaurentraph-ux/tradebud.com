# Tracebud — Onboarding Transactional Email Templates

Production sends email from `src/launch/onboarding-email.service.ts` (Resend on Railway).
The Supabase confirm template is pasted directly into the Supabase Dashboard and is **not** sent via Resend.

---

## Sequence

| ID       | Trigger                                          | Subject                                              |
|----------|--------------------------------------------------|------------------------------------------------------|
| A        | Workspace setup saved (wizard step 2)            | Welcome to Tracebud — your workspace is ready        |
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
    resume-nudge-first.html    Email B — Resume nudge #1
    resume-nudge-final.html    Email C — Final reminder
    supabase-confirm-email.html Bonus — Supabase Auth confirm (paste into Supabase Dashboard)
  text/
    welcome.txt                Email A plain text
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

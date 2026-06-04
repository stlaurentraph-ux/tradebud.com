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

## NestJS / Resend usage

Paste the contents of each `html/*.html` file into the `html:` field of your Resend `sendEmail` call,
and the matching `text/*.txt` into the `text:` field. Replace merge tags with your template engine
(Handlebars, Mustache, or string interpolation).

```ts
// Example (onboarding-email.service.ts)
await resend.emails.send({
  from: 'Tracebud <no-reply@tracebud.com>',
  to: user.email,
  subject: 'Welcome to Tracebud — your workspace is ready',
  html: welcomeHtml
    .replace(/{{firstName}}/g, user.firstName)
    .replace(/{{organizationName}}/g, org.name)
    .replace(/{{country}}/g, org.country)
    .replace(/{{roleLabel}}/g, org.roleLabel)
    .replace(/{{loginUrl}}/g, LOGIN_URL)
    .replace(/{{year}}/g, String(new Date().getFullYear())),
  text: welcomeTxt /* same replacements */,
});
```

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

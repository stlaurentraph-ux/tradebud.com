# Onboarding transactional email templates

Design workspace for v0 and manual HTML exports. Production sends mail from
`src/launch/onboarding-email.service.ts` (Resend on Railway).

## Sequence (wizard step 2 = complete)

| ID | Trigger | Subject (current) |
|----|---------|-------------------|
| A | Workspace setup saved (step 2) | Welcome to Tracebud — your workspace is ready |
| B | Cron: signup +24h, workspace incomplete | Finish setting up your Tracebud workspace |
| C | Cron: +48h after B (max 2 nudges) | Reminder: your Tracebud workspace is almost ready |

Optional: Supabase Auth **Confirm email** — configure in Supabase Dashboard; match visuals only.

## Merge tags

- `{{firstName}}`, `{{organizationName}}`, `{{country}}`, `{{roleLabel}}`
- `{{loginUrl}}` — `https://dashboard.tracebud.com/login`
- `{{resumeUrl}}` — magic link → `/create-account?resume=workspace`
- `{{year}}`

## Brand tokens

- Forest canopy: `#064E3B`
- Data emerald: `#10B981`
- Primary CTA green: `#16A34A`
- Resume CTA blue: `#1D4ED8`
- Body: `#022C22` / `#111827`
- Muted footer: `#64748B`
- Logo: `https://dashboard.tracebud.com/tracebud-logo-v6.png`

## v0 workflow

1. Connect this repo, branch `feat/onboarding-email-templates`.
2. Generate table-based HTML + plain-text under `html/` and `text/`.
3. Open PR into `main`; then port finalized HTML into `onboarding-email.service.ts`.

## Placeholder files

- `html/welcome.html` — Email A
- `html/resume-nudge-first.html` — Email B
- `html/resume-nudge-final.html` — Email C
- `text/*.txt` — plain-text counterparts

Replace placeholders with v0 output; do not commit secrets.

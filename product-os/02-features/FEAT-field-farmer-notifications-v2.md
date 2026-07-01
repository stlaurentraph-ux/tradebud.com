# FEAT: Field farmer notifications (Release 2)

## Status

| Slice | Scope | Release | Status |
|-------|--------|---------|--------|
| **V2.1** | Password security email after successful set/change | R2 | **Registered — not in v1 / build 26** |
| **V2.2** | In-app activity feed (compliance + document history) | R2 | **Registered — not in v1** |

Parent spec item: **P2-11** (notification delivery model) in `product-os/01-roadmap/v1-6-spec-execution-board.md`.

## Goal

Give farmers durable, trustworthy notification of account and compliance changes — without relying on ephemeral push alone.

## v1 behavior (explicit non-goals for build 26)

- **Set password** (OAuth → Settings → Set password): backend `POST /v1/me/account-password` uses Supabase Admin `updateUserById` with `email_confirm: true`. **No confirmation or security email is sent.** Success is in-app only (`settings_password_saved_*` copy).
- **Change password**: same — no outbound email today.
- Push (when enabled): consent requests, tenure review nudges, geometry rejections — **no inbox/history** in the field app.

Registered 2026-07-01 after Hector account device QA: password set succeeded but no email received (expected for v1).

---

## V2.1 — Password security email

### Why

Farmers expect a security notice when a password is added or changed (especially after Google/Apple sign-in). Reduces support confusion (“did it work?”) and matches common account-security UX.

### Trigger

After **successful** `FieldAccountService.setPasswordForAuthUser` (field app `POST /v1/me/account-password`):

- First-time **set** (OAuth account gains email+password identity)
- **Change** (existing email+password identity)

Do **not** send on failed validation, sign-in required, or idempotent no-op repair (`ensureEmailIdentityForAuthUser` only).

### Delivery

- **Preferred:** Tracebud backend **Resend** transactional email (same stack as tenure staff alerts), not Supabase Auth default templates — branded copy, delivery log, retry policy aligned with P2-11.
- **Alternative (document only):** Supabase “security notifications” — less control over farmer-facing copy and no unified delivery log with other Tracebud emails; defer unless Resend unavailable.

### Email content (farmer-facing)

- Subject: e.g. `Your Tracebud password was saved` / `Your Tracebud password was changed`
- Body: timestamp (user locale), masked email, plain language that email+password sign-in now works on any device; Google/Apple sign-in still works; **never include the password**; link to `https://tracebud.com/support` if this wasn’t them
- Locale: start with **en**; i18n keys in field app message files for parity when in-app copy references the email

### Permissions

- Only the authenticated user who initiated the password set receives the email (address from Supabase user record at time of success).
- No cross-tenant leakage; no email to cooperative staff for farmer password events.

### State transitions

| Event | Email |
|-------|--------|
| `account_password_set` (OAuth → password) | Send once on success |
| `account_password_changed` | Send once on success |
| Failed set/change | No email |
| Sign-up email+password (Supabase signup confirm) | Out of scope — existing Supabase confirm flow |

### Exception handling

- Email send failure **must not** fail the password API (password already saved). Log + audit; optional in-app toast “Password saved; we couldn’t send a confirmation email.”
- Resend rate limits / bounce: record in delivery log; do not retry password in email.
- Missing `RESEND_API_KEY`: skip send, log warn (same pattern as tenure staff emails).

### Analytics / audit

- Audit: `farmer_password_security_email_sent` | `farmer_password_security_email_failed` (payload: `userId`, `kind: set|change`, no password).
- Analytics (field): optional `PASSWORD_SECURITY_EMAIL_SENT` if product wants funnel — not required for v2.1 MVP.

### Acceptance criteria

- [ ] After successful set password on Google-signed-in farmer, email arrives within 2 minutes at account email.
- [ ] After successful change password, distinct “changed” subject/body.
- [ ] Failed password set returns error to app; **no** email sent.
- [ ] API response `{ ok: true }` even when email send fails (with server log).
- [ ] No password or reset link with embedded secret in email (informational only; sign-in via app).
- [ ] Unit/integration test: mock Resend; assert call on success, no call on failure.

### Dependencies

- `tracebud-backend` `FieldAccountService`, Resend config (`RESEND_API_KEY`, from address)
- Optional: P2-11 `notification_delivery_log` table if landed before implementation; else audit_log row is enough for v2.1

### Out of scope (V2.1)

- Password reset / forgot-password flow (separate slice)
- Dashboard org-user password emails
- SMS

---

## V2.2 — In-app activity feed (related)

**v1 slice shipped/in progress:** [`FEAT-field-farmer-activity-feed.md`](FEAT-field-farmer-activity-feed.md) — client-derived feed with SQLite cache. Future P2-11 work may add server-backed history via `GET /v1/me/field-activity`.

---

## References

- `apps/offline-product/features/auth/accountPassword.ts` — client set-password flow
- `tracebud-backend/src/auth/field-account.service.ts` — server password + identity repair
- `tracebud-backend/src/plots/tenure-review-alert.service.ts` — Resend pattern for alerts
- `product-os/01-roadmap/v1-6-spec-execution-board.md` § P2-11

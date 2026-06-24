# ADR-012: Farmer identity — email-primary outreach and phone/WhatsApp fallback

**Status:** Accepted (2026-06-24)  
**Scope:** Farmer CRM contacts, campaign delivery, field-app auth, campaign invite claim, buyer fulfillment provenance  
**Supersedes (partial):** ADR-011 §2 dedup for **verified farmer phone** — hard one-phone-per-user replaces soft shared-phone merge for self-serve farmers

## Context

Tracebud today assumes **email everywhere** for farmer-facing flows:

- Field app sign-in: email + password or Google/Apple OAuth
- CRM contacts: `email NOT NULL`, unique per tenant
- Campaign send: `target_contact_emails`; invites keyed on `recipient_email`
- Invite claim on bootstrap: match `recipient_email` to signed-in user

Cooperative enumeration (ADR-011 / FEAT-012) already collects **phone or national ID** offline with email optional when enumerators register members. Product discussions locked additional constraints:

| Topic | Decision |
|-------|----------|
| **Primary identity / outreach** | **Email first.** Phone/WhatsApp only when the farmer has no email. |
| **Self-serve** | Phone-only farmers are **expected to use the field app themselves** — coop mapping is onboarding, not the permanent model. |
| **Outreach channels (no email)** | **WhatsApp first**, then SMS; email when present; desk QR / office visit as last resort. All channels should be possible long-term. |
| **Shared phones** | **One phone = one user.** Hard uniqueness on normalized phone for farmer identities — no shared-phone merge queue. |
| **National ID** | Optional roster/import aid — not required when email or verified phone exists. Store as **hash + last 4** (never plain text in CRM); full ID images flow through evidence/tenure pipeline only. |
| **Buyer fulfillment** | Tiered provenance: farmer-direct (preferred) vs cooperative-on-behalf (valid exception, visibly labeled). |

Dashboard and supplier (B2B) users remain **email-primary** — this ADR applies to **farmer** contacts and producer self-serve only.

## Decision

### 1. Contact-centric campaigns (email-primary delivery resolver)

Campaigns target **CRM contact IDs**, not raw email strings. At send time the backend resolves each contact to a delivery plan:

```
1. contact.email present     → channel: email (invite link + existing email/OAuth sign-in)
2. no email, phone present   → channel: whatsapp (preferred) → sms fallback
3. neither                   → channel: desk_only (coop desk / QR at office; still aim for farmer claim)
```

**Product copy principle:** *Use email if they have one. Use WhatsApp only when they don't.*

Denormalized `target_contact_emails` may remain for audit during migration; canonical target list is `target_contact_ids`.

### 2. CRM farmer contacts — relax email, enforce reachability rules

For `contact_type = 'farmer'`:

| Field | Rule |
|-------|------|
| `email` | Preferred; required unless farmer explicitly has no email |
| `phone_e164` | Required when email absent; normalized E.164 on write |
| `national_id_hash` + `national_id_country` | Optional; hash only for dedup/search |
| `digital_reachability` | Derived: `email` \| `phone` \| `desk_only` |

**Constraint:** at least one of `email`, `phone_e164`, or linked `farmer_profile_id` (from enumeration sync).

B2B contact types (exporter, cooperative desk, trader, etc.) keep **email required**.

**Dashboard UX:** email field first with helper text; phone section labeled *only if no email*; confirm toggle before phone becomes required.

### 3. Phone uniqueness — one phone, one farmer

When `phone_e164` is set on a farmer contact or verified via OTP:

- **Hard block** second farmer with the same normalized phone (tenant scope minimum; **global among verified farmer profiles** recommended once OTP linked).
- Enumeration provisional create: reject duplicate phone in local roster; on sync, server rejects duplicate with actionable error (not silent merge).
- Phone change: desk-assisted update with re-verification; release old number.

ADR-011 offline dedup warnings for probable duplicate phone remain for **unverified roster import**; once phone is OTP-verified, uniqueness is strict.

### 4. National ID — optional, privacy-safe

National ID is **not** a login factor and **not** required for dedup when email or verified phone exists.

| Use | Storage |
|-----|---------|
| Roster CSV / enumerator import matching | `national_id_hash` (HMAC-SHA256 of normalized ID + country salt) + `national_id_last4` for desk display |
| Photographed ID card | Tenure/evidence document — same retention/GDPR pipeline as land papers |
| CRM export / analytics | Hash and last 4 only — never full ID |

Desk may merge import duplicates flagged by ID hash with operator acknowledgement (same spirit as ADR-011 — no silent merge of distinct people).

### 5. Campaign recipient invites — contact_id + claim token

Evolve `campaign_recipient_invites`:

| Column | Purpose |
|--------|---------|
| `contact_id` | FK → `crm_contacts.id` — canonical recipient |
| `delivery_channel` | `email` \| `whatsapp` \| `sms` \| `desk_only` |
| `delivery_address` | Snapshot: email or E.164 at send time |
| `claim_token_hash` | SHA-256 of opaque token embedded in invite URL |
| `claim_expires_at` | Default 30 days |
| `claimed_farmer_profile_id` | Existing — set on successful claim |
| `recipient_email` | Legacy — populated from contact email during migration |

**Uniqueness:** `UNIQUE (campaign_id, contact_id)`.

**Invite URL (field-auth):** `https://auth.tracebud.com/campaign?campaign={id}&token={opaque}` → deep link `tracebudoffline://campaign?campaign={id}&token={token}`.

**Claim:**

- **Email path:** sign in with matching email/OAuth → `claimInvite(token)` links `farmer_profile.user_id`.
- **Phone path:** phone OTP in field app → same claim endpoint; bootstrap keys on `user_id` + `contact_id`, not email.

`campaign_delivery_attempts` (new) audits per-channel send/delivery/open for compliance.

### 6. Field app auth — conditional phone OTP

| Farmer has | Sign-in |
|------------|---------|
| Email | Email + password, Google, Apple (unchanged) |
| No email, has phone | Phone OTP after WhatsApp/SMS invite |
| Email added later | Link to existing `farmer_profile`; email becomes primary for outreach and auth |

Phone OTP is **only** exposed for accounts/contacts without email — not a parallel primary login for farmers who have email.

### 7. Enumeration → self-serve handoff

Enumerators may create `farmer_profile` + CRM contact without `user_id` (plots synced under cooperative agent).

**End state:** farmer receives invite → signs in (email or phone per contact) → claims profile → sees existing plots.

Coop-mediated capture does not replace farmer account ownership when contact has a reachable digital channel.

### 8. Buyer fulfillment provenance

Campaign recipient timeline exposes **fulfillment source**:

| Source | Buyer label | When |
|--------|-------------|------|
| `farmer_app_email` | Responded in Tracebud (email account) | Farmer claimed + acted under `user_id` via email/OAuth |
| `farmer_app_phone` | Responded in Tracebud (phone verified) | Farmer claimed + acted via phone OTP |
| `cooperative_on_behalf` | Submitted by {org} on behalf of farmer | Agent/desk upload when farmer did not complete claim in policy window |

**Default campaign policy:** accept all three; rank farmer-direct highest in UI (green vs amber).

**Optional strict tenant setting:** `require_farmer_app_confirmation` — coop-only rows stay pending until farmer claims or buyer overrides with reason.

Cooperative-mediated fulfillment is **valid** for EUDR progress when `farmer_profile_id`, cooperative actor, and audit trail are present — not interchangeable with farmer-direct in the UI.

### 9. Implementation phasing (non-binding order)

| Phase | Deliverable |
|-------|-------------|
| **P1** | CRM: farmer email preferred; phone when no email; uniqueness validation |
| **P2** | Campaigns: `target_contact_ids`; email send branch; invite `contact_id` |
| **P3** | WhatsApp delivery + claim token landing (field-auth copy) |
| **P4** | Field app phone OTP (no-email farmers only) + token claim |
| **P5** | Buyer timeline fulfillment source + coop exception workflow |
| **P6** | SMS, desk QR print helper, `campaign_delivery_attempts` |

Backward compatibility: existing `claimCampaignInvitesForFieldFarmer(recipientEmail)` remains until migration complete.

## Consequences

- Schema: nullable farmer `email` on `crm_contacts`; `phone_e164` unique partial index; `target_contact_ids` on `request_campaigns`; invite table extensions; optional `campaign_delivery_attempts`.
- Integrations: WhatsApp Business API (templates, delivery receipts); SMS provider as fallback; Supabase phone auth for no-email farmers.
- Dashboard: contact wizard, campaign recipient chips (📧 / 📱 / 🏢), fulfillment provenance on campaign decisions timeline.
- Field app: conditional phone OTP; campaign deep link accepts `token`; field-auth channel-aware copy.
- Registries: update `dashboard-crm-outreach-registry.md`, `network-routing-registry.md`, `farmer-artifact-sync-registry.md` when implemented.
- Analytics: `campaign_delivery_sent`, `campaign_invite_opened`, `campaign_invite_claimed`, `farmer_auth_phone_otp`, `fulfillment_source_*`.
- ADR-011: enumeration still collects email when available; phone/ID minimum for provisional members unchanged; **verified phone uniqueness** overrides shared-phone soft-merge for self-serve farmers.

## References

- `ADR-011-cooperative-enumeration-and-tile-bootstrap.md` — enumeration identity (partial supersede on phone dedup)
- `FEAT-012-cooperative-enumeration-mode.md`
- `product-os/03-workflows/supplier-onboarding.md`
- `tracebud-backend/sql/tb_v16_024_crm_contacts.sql`
- `tracebud-backend/sql/tb_v16_061_campaign_recipient_invites.sql`
- `tracebud-backend/src/requests/claim-campaign-invites-for-field-farmer.ts`
- `apps/field-auth/app/campaign/page.tsx`

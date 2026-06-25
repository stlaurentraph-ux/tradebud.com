# FEAT-014: Supplier campaign onboarding

## Canonical sources

- `JTBD_PRD.md`, `MVP_PRD.md`, `BUILD_READINESS_ARTIFACTS.md`
- `ADR-010-network-invite-orchestration.md`
- `ADR-012-farmer-phone-reachability.md` (phone-only CRM targets)
- `product-os/03-workflows/supplier-onboarding.md`
- `product-os/04-quality/network-routing-registry.md`

## Goal

Off-platform suppliers and field producers invited via request campaigns can sign up, land in the right inbox or data-sharing flow, and move sender CRM contacts through `invited` → `engaged` → `submitted` when evidence is fulfilled.

## Users affected

| Role | Change |
|------|--------|
| Exporter / cooperative (sender) | Campaign outreach + CRM pipeline visibility |
| Dashboard supplier | Email CTA → signup → `/inbox?campaign=` |
| Field producer | App deep link → banner → data sharing |
| Public (pre-auth) | Campaign preview API for org/title/due date |

## Scope — Phase A (this slice)

- `campaign_recipient_invites` queue for unresolved outreach emails
- Post-signup orchestrator `linkPendingNetworkInvitesOnSignup`
- CRM `claimSupplierContactsOnSignup` + `markCrmContactSubmittedOnFulfill`
- Public `GET /v1/public/requests/campaigns/:id/preview`
- Field + dashboard UX (banner, redirect, pipeline chips)
- Migration apply/verify scripts + deploy smoke public probes
- Integration test: invite → signup claim → fulfill → CRM submitted

## Non-goals (Phase A)

- WhatsApp / SMS campaign delivery (desk-only phone targets only)
- Generic network graph UI
- Public preview rate limiting (future — see FEAT-011 pattern)

## Permissions

- Public preview: read-only, no PII beyond org name + request title + due date
- Invite claim: existing signup/bootstrap auth only
- CRM status changes: sender tenant scope on fulfill hooks

## State transitions

| Entity | Transition |
|--------|------------|
| `campaign_recipient_invites` | `pending`/`sent` → `claimed` on signup |
| `crm_contacts` (sender) | `new`/`invited` → `engaged` on signup → `submitted` on fulfill |
| `inbox_requests` | Created/backfilled on claim |

## Exception handling

| Failure | UX / ops |
|---------|----------|
| Unknown campaign id (preview) | Public 404; structured `public_preview_lookup` log |
| Sender tenant = recipient tenant | Invite claim skipped (audit `campaign_recipient_invite_claim_skipped`) |
| CRM table missing (legacy env) | Claim/fulfill no-ops gracefully (`42P01`) |
| Resend send failure | Campaign row stays `sent`/`pending`; retry from dashboard |

## Analytics events

| Event | Surface |
|-------|---------|
| `campaign_invite_banner_shown` | Field home |
| `campaign_invite_preview_loaded` | Field `/campaign` + data sharing |
| `campaign_invite_remind_later` | Field banner |
| `supplier_pipeline_chip_viewed` | Dashboard directory |

## Ops / monitoring

| Check | Command |
|-------|---------|
| Apply migrations (bundle) | `npm run db:apply:supplier-campaign-onboarding -w tracebud-backend` |
| Verify migrations | `npm run db:verify:supplier-campaign-onboarding -w tracebud-backend` |
| Post-deploy public routes | `npm run deploy:smoke -w tracebud-backend` (404 probes on fake ids) |
| Integration path | `npm run test:integration:supplier-onboarding -w tracebud-backend` |
| Structured logs | `public_preview_lookup` JSON on public preview controllers |
| Sentry | Breadcrumb `public_preview:{surface}:{outcome}` |

## Acceptance criteria — Phase A

- [x] Campaign send queues `campaign_recipient_invites` for unresolved emails
- [x] Dashboard supplier signup claims invite + inbox backfill
- [x] Field farmer deep link stores campaign + claims on bootstrap
- [x] CRM `invited` → `engaged` on signup (both lanes)
- [x] CRM `engaged` → `submitted` on inbox respond or consent approve
- [x] Public campaign preview API (no emails in response)
- [x] `db:apply` / `db:verify` scripts for TB-V16-061–063
- [x] Deploy smoke probes for delivery + campaign public previews
- [x] Integration test `supplier-campaign-onboarding.int.spec.ts`
- [ ] Full outreach → field fulfill path signed off on staging

## Railway deploy rule

Production API deploys via **git push to linked branch** only. Manual Railway “Redeploy” / `railway up` from a subdirectory snapshot is unsupported — see `tracebud-backend/DEPLOY_PRODUCTION.md`.

## Branch discipline

- **This slice:** `feature/backend-supplier-campaign-onboarding`
- **Delivery QR (FEAT-011):** `feature/delivery-intake-qr` — do not mix ops hardening commits there
- **Enumeration:** `feature/offline-enumeration-mode`

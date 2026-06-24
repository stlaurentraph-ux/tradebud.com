# Supplier Onboarding

## Canonical sources

- `JTBD_PRD.md`, `BUILD_READINESS_ARTIFACTS.md`, `MVP_PRD.md`
- `ADR-010-network-invite-orchestration.md`
- `product-os/04-quality/network-routing-registry.md`

## Actors

| Actor | Lane |
|-------|------|
| Requesting org | Exporter / importer / cooperative — sends campaigns |
| Dashboard supplier | Off-platform org email — dashboard signup + inbox |
| Field producer | Off-platform farmer email — field app signup + data sharing |

## CRM contact states (sender directory)

`new` → `invited` (campaign send) → `engaged` (signup/bootstrap) → `submitted` (evidence fulfilled)

## Dashboard supplier happy path

1. Send campaign → `create-account?campaign={id}` in email.
2. Signup → `linkPendingNetworkInvitesOnSignup` (inbox + CRM engaged).
3. Redirect → `/inbox?campaign={id}`.

## Field producer happy path

1. Send campaign (farmer CRM contact) → `app.tracebud.com/campaign?campaign={id}`.
2. Field-auth → `tracebudoffline://campaign?campaign={id}`.
3. Field app stores campaign → sign-in → bootstrap with `campaignId`.
4. `claimCampaignInvitesForFieldFarmer` claims invite + links `farmer_profile_id`.
5. Farmer opens **Data sharing** to approve requests.

## Field UX (2026-06-24)

- Public campaign preview API → org name + due date on banner and data-sharing context.
- Home banner uses warning-accent card; onboarding hidden while invite pending.
- Deep link `/campaign` → Home; data-sharing highlights matching pending grant + success state.

## Dashboard UX (2026-06-24)

- Supplier directory shows pipeline chips (`ContactStatusPipeline`: new → invited → engaged → submitted) and a **Submitted** stat card.

## Fulfillment → CRM submitted

- **Dashboard:** `inbox.service.respond` → `markCrmContactSubmittedOnFulfill` (match sender tenant + recipient email).
- **Field:** `consent.service.approveGrant` → `markCrmContactSubmittedOnFulfill` (match grantee tenant + `farmer_profile_id`).

## Acceptance criteria

- [x] Dashboard supplier: create-account campaign deep link + inbox backfill
- [x] Field farmer: field-auth + app deep link + bootstrap claim
- [x] CRM `invited` → `engaged` on both lanes
- [x] Auto `engaged` → `submitted` on fulfill (`markCrmContactSubmittedOnFulfill` — inbox respond + consent approve)

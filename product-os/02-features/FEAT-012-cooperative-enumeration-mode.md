# FEAT-012: Cooperative enumeration mode

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md` — plot geometry, duplicate_status, AGENT_ENTRY capture
- `ADR-011-cooperative-enumeration-and-tile-bootstrap.md`
- `ADR-012-farmer-identity-email-primary-phone-fallback.md` — email-primary outreach; phone/WhatsApp fallback for no-email farmers
- `ADR-008-capture-quality-tiers.md`
- `FEAT-002-mobile-field-capture.md` — offline sync, agent assignment backend
- `BUILD_READINESS_ARTIFACTS.md` — Field Agent, Field Manager
- `JTBD_PRD.md` — field agent JTBD (many farmers, validation before leaving)

## Goal

Enable cooperative field operators to map **multiple farmers and plots in one offline day** with complete one-trip evidence, hybrid roster/provisional identity, duplicate guards, and confirm-gated district satellite tiles — without sacrificing EUDR compliance or future full-boundary analytics (regenerative practice, carbon).

## Users affected

| Role | Change |
|------|--------|
| **Field agent / enumerator** (field app, `agent`) | Enumeration mode home, member queue, provisional create, linear capture wizard |
| **Field manager** (dashboard, cooperative) | Publish mapping campaign (roster + region bbox), review provisional merges, geometry approval |
| **Farmer** | Unchanged default mode; may receive linked profile when operator registers on their behalf |
| **Cooperative admin** | Campaign + tile region config; optional `preferred_capture_mode` |

## Problem

Today the field app assumes one farmer profile. Operators assisting dozens of members must workaround via hidden farmer UUID input, cannot prefetch a roster offline, and manually download map tiles. Assignment lifecycle exists on dashboard only. Volume is not the goal — **correct multi-member capture in one trip** is.

## Scope

### In scope (phased)

1. **Enumeration mode shell** — agent-only entry; member queue; active member switcher
2. **Roster prefetch** — download campaign/CRM targets to SQLite before field day
3. **Provisional members** — offline create with name, village, phone or national ID, email optional
4. **Linear capture wizard** — geometry → photos → tenure/attestation → next (one trip)
5. **Geometry two-layer policy** — EUDR floor + encourage full boundary under 4 ha
6. **Duplicate detection** — offline warnings + sync dedup
7. **Confirm-gated district tiles** — tenant/campaign bbox, Wi‑Fi download after user confirms region
8. **Mobile assignment wire-up** — download active assignments; send `assignmentId` on plot/sync POST

### Non-goals

- Throughput SLA (plots per day)
- Silent install-time tile download or country-wide auto packs
- Replacing desk geometry approval (ADR-008)
- Bluetooth GNSS (ADR-008 later / pilot-only)
- Farmer app redesign

## Key entities

| Entity | Storage | Notes |
|--------|---------|-------|
| `field_roster_entry` | SQLite + server campaign targets | Prefetched member row |
| `provisional_member` | SQLite until sync | Local UUID → `farmer_profile` on upload |
| `mapping_campaign` | Backend + dashboard | Roster + `mapping_region_bbox` + tile manifest |
| `enumeration_session` | SQLite | Active member, capture step, day progress |
| `offline_tiles_pack` | Device filesystem | District bbox from campaign |

## Permission and tenant boundary matrix

| Actor | Allow | Deny |
|-------|-------|------|
| `agent` with tenant claim | Capture for roster/provisional members in tenant; delegated plot POST; assignment-scoped sync | Cross-tenant member access |
| `farmer` | Standard self-capture only | Enumeration mode, provisional create for others |
| Dashboard cooperative roles | Publish campaign, merge provisional contacts, approve geometry | Bypass tenant scope |
| Missing tenant claim | — | Roster fetch, delegated plot POST, campaign tile manifest (fail closed) |

Agent plot sync must continue to enforce active `agent_plot_assignment` when `assignmentId` present (existing backend S1 slices).

## State transitions

### Member / roster

- `roster_prefetched → member_selected → capture_in_progress → member_completed → (next member | sync_pending)`
- `provisional_created → first_plot_saved → sync_queued → synced_linked` (CRM contact linked)
- `provisional_created → dedup_match_suspected → desk_review` (operator chose “create anyway” or server flagged)

### Capture wizard (per plot)

- `geometry_capture → ground_truth_photos → tenure_attestation → plot_saved_local → queue_enqueued`
- Geometry substates unchanged from FEAT-002 (`walk` / `pin` / `draw` / `centroid`) with `captureIntent` metadata

### Tile bootstrap

- `tenant_linked → region_prompt_shown → region_confirmed → wifi_check → downloading → pack_active`
- `region_declined → manual_region_select | deferred_until_campaign`

### Sync

- Unchanged canonical queue: `queued_offline → synced | sync_failed_retryable | sync_rejected`
- Bulk end-of-day upload uses existing `runFieldSyncPipeline` with enumeration scope metrics

## Exception handling and recovery

| Failure | UX / recovery |
|---------|----------------|
| Roster prefetch failed (offline) | Use cached roster if any; allow provisional-only mode; banner “Roster outdated” |
| Provisional missing phone and ID | Block save; inline validation |
| GEO-105 overlap | Hard block; offer link to existing plot/member |
| Probable duplicate member | Warn; “Use existing member” / “Create anyway (desk review)” |
| Tile download interrupted | Resume download; fall back to GPS walk/pin without trace |
| GEO-108 (no tile coverage) | Pin/walk still allowed; trace blocked with “Download region map” CTA |
| Plot upload 429 / offline | Local queue; Settings sync with smart sweep (existing) |
| Assignment scope mismatch | Fail closed; show assignment id error from backend |

## Analytics events

| Event | When |
|-------|------|
| `enumeration_mode_entered` | Agent opens enumeration home |
| `enumeration_roster_prefetched` | Campaign roster downloaded |
| `enumeration_member_selected` | Operator picks roster row |
| `enumeration_provisional_created` | New offline member |
| `enumeration_duplicate_warning_shown` | Member or overlap warning |
| `enumeration_capture_intent_full_boundary` | Operator chose full polygon under 4 ha |
| `enumeration_plot_completed` | Wizard finished for one plot |
| `enumeration_session_sync_started` | End-of-day sync |
| `tile_bootstrap_prompt_shown` | Region confirm dialog |
| `tile_bootstrap_confirmed` / `_declined` | User region choice |
| `tile_bootstrap_download_started` / `_succeeded` / `_failed` | District pack lifecycle |

Include `tenantId`, `campaignId`, `assignmentId`, `captureIntent`, `geometryConfidenceTier`, `clientPlotId` where applicable.

## v1.6 architecture constraints

| Gate | Applicability |
|------|----------------|
| **Spatial correctness** | All polygons through existing validation (`ST_MakeValid`, area variance) on upload |
| **HLC / offline conflict** | Unchanged; provisional members use new local farmer ids with idempotent plot POST |
| **Tenant isolation** | Roster and campaigns tenant-scoped; dedup never merges across tenants |
| **GDPR** | Provisional PII (phone, email, ID) follows existing contact retention; erasure via CRM |
| **Lineage / TRACES** | No change in this feature; plots feed existing materialized lineage on seal |

## Execution phases

### Phase A — Planning + contracts (this slice)

- [x] ADR-011 accepted
- [x] FEAT-012 spec (this doc)
- [ ] OpenAPI: `GET /v1/me/field-enumeration-pack` (roster + bbox + assignments) — draft
- [x] Registry scaffold: `field_roster_entry` in `farmer-artifact-sync-registry.md`

### Phase B — Mobile enumeration shell + provisional identity (2026-06-24)

- [x] Agent detection → enumeration home vs farmer home
- [x] Member queue UI + switcher
- [x] Provisional create form (name, village, phone|ID, email optional)
- [x] Plot save uses selected member `farmerId`; `producerContactId` when from roster
- [x] Offline duplicate warnings (member match)
- [x] Tests: provisional validation, member dedup
- [x] WalkPerimeter guard when agent has no active member selected
- [x] Plot sync bootstraps each roster member `farmerId` before upload
- [x] WalkPerimeter active-member banner
- [x] Member-scoped GEO-105 overlap checks (same `farmerId` only)

### Phase C — Linear one-trip wizard + capture intent (2026-06-24)

- [x] One-trip completion flow for enumeration (geometry → photos → tenure CTA → member queue)
- [x] Under 4 ha: pin default + “Map full boundary” CTA in enumeration mode
- [x] Persist `captureIntent` on `geometryCapture` (`eudr_minimum` | `full_boundary`)
- [x] Wire `assignmentId` on plot POST when roster row has assignment
- [x] Tests: captureIntent resolution + geometryCapture metadata
- [ ] Full linear wizard shell (tenure inline without plot detail hop) — deferred polish

### Phase D — Roster prefetch + sync linking (2026-06-24)

- [x] Backend `GET /v1/me/field-enumeration-pack` (campaign targets + CRM farmer contacts)
- [x] Backend `POST /v1/me/field-enumeration-provisional-sync` (provisional → profile + CRM)
- [x] SQLite roster merge on prefetch; auto/manual prefetch on enumeration home
- [x] Provisional member server link on sync + after sign-in
- [ ] Dashboard provisional merge queue (minimal) — deferred
- [x] Tests: pack merge helpers + backend tag/dedup spec

### Phase E — Confirm-gated district tiles (2026-06-24)

- [x] Campaign `mapping_region_*` columns + pack API `mappingRegion`
- [x] Post-roster-prefetch region confirm dialog (GPS hint)
- [x] Size gate (>50 MB Wi‑Fi ack) + zoom cap; download district pack; set active pack
- [x] Decline path → `/offline-maps` manual picker
- [x] Tests: bbox parse/containment, size estimate, zoom cap

### Phase F — Field manager ops (dashboard) (2026-06-24)

- [x] Publish mapping campaign region (bbox + label on map)
- [x] Collection progress: members complete / plots captured / provisional pending review
- [x] Geometry approval counts in progress table (existing S6.4 card integration via pending counts)
- [ ] Provisional merge queue (minimal desk UI) — deferred

## Acceptance criteria (Phase B–E minimum viable enumeration)

- [ ] Signed-in `agent` sees enumeration home with member queue, not single-farmer home
- [ ] Operator prefetches roster while online; roster searchable offline by name/village
- [ ] Operator creates provisional member offline with required fields; optional email saved when provided
- [ ] Operator completes one full plot for member A, switches to member B, captures second plot — both persist locally with correct `farmerId`
- [ ] Overlap with existing local plot blocks save with GEO-105 UX
- [ ] Probable duplicate member shows warning before provisional create
- [ ] Under 4 ha plot: pin save works; “Map full boundary” available; `captureIntent` stored
- [ ] ≥ 4 ha plot: polygon required (existing gate)
- [ ] One-trip wizard collects geometry + ground-truth photos + tenure/attestation without leaving flow
- [ ] After sign-in, operator confirms region → district tile pack downloads on Wi‑Fi → manual trace allowed inside bbox
- [ ] Sync links provisional members; desk can see `provisional` contacts; phone/ID/email dedup flags duplicates
- [ ] `assignmentId` sent when operator has active assignment for plot/member
- [ ] Analytics events emitted per matrix above
- [ ] `npm run qa:structural` + enumeration unit tests pass

## Dependencies

- `FEAT-002` agent assignment backend (shipped)
- `ADR-008` geometry confidence + desk approval (shipped / in progress)
- Campaign targets API (`/v1/requests/campaigns/{id}/targets`) — extend or wrap for enumeration pack
- Offline tiles pipeline (`offlineTiles.ts`, `manualTraceImagery.ts`)
- CRM contacts + `producerContactId` on plot create (shipped)

## Tests (planned)

| Area | Command / file |
|------|----------------|
| Provisional validation | `features/enumeration/provisionalMember.test.ts` |
| Dedup warnings | `features/enumeration/memberDedup.test.ts` |
| Capture intent | `features/compliance/plotGeometryCapture.test.ts` (extend) |
| Tile bootstrap | `features/offlineTiles/enumerationTileBootstrap.test.ts` |
| Backend pack | `src/me/field-enumeration-pack.spec.ts` |
| Structural | `npm run qa:structural` (offline + backend registries) |

## Risks

| Risk | Mitigation |
|------|------------|
| One-trip wizard too slow for large polygons | Encourage pin for &lt; 4 ha; corner-pin path for medium plots |
| Provisional dedup false positives | Desk merge queue; require phone or ID |
| Tile pack too large | Wi‑Fi gate; zoom level caps; campaign splits multi-district cooperatives |
| Agent/farmer UX confusion | Role-gated mode switch; farmers never see enumeration home |

## Open questions

- [ ] Campaign publish UX: CRM multi-select vs CSV vs both?
- [ ] Email required for provisional before sync, or optional until desk enrichment?
- [ ] Single active mapping campaign per device vs many?

## Status

**Planning complete** — Phase A docs accepted 2026-06-24. **Phase B core shipped locally** (enumeration home, provisional members, plot scoping, sync bootstrap); polish + Phase C wizard next.

## Definition of done

- Phases B–E acceptance criteria checked
- `farmer-artifact-sync-registry.md` updated for roster + enumeration session
- `field-capture-quality-registry.md` updated for `captureIntent`
- `daily-log.md` / `done-log.md` updated on ship

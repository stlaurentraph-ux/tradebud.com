# ADR-011: Cooperative enumeration mode and confirm-gated tile bootstrap

**Status:** Accepted (2026-06-24)  
**Scope:** Field app agent/cooperative operator workflows, offline roster + provisional members, district satellite tile packs

## Context

Cooperative field operators map plots for **many farmers in one offline day**. The current field app is optimized for a single farmer mapping their own plots: one active profile, no member queue, assignment lifecycle only on dashboard, and tile download as a manual Settings action.

Product discussions locked these constraints:

- **Identity:** roster-first with offline provisional members; minimum fields include name, village, phone or national ID, and email when available.
- **Geometry:** EUDR floor by declared area (&lt; 4 ha point allowed; ≥ 4 ha polygon required); cooperatives should **encourage full boundary** capture for future regenerative / carbon use cases even when point is compliant.
- **Evidence:** complete one-trip checklist (geometry + ground-truth photos + tenure/attestation) — no deferred second visit wave.
- **Duplicates:** offline overlap warnings + server dedup on sync.
- **Tiles:** district-level packs (Option A), not per-operator “near me” as the default for enumeration.

Automatic tile download at app install is tempting but unsafe: VPN/travel mis-locates users, install location ≠ field region, packs are large, and single-farmer users do not need district imagery.

## Decision

### 1. Introduce **enumeration mode** (UX shell, `agent` role)

Enumeration mode is a field-app experience for users with JWT role `agent` (and future cooperative field-operator personas linked to a tenant). It does **not** introduce a new auth role.

| Surface | Farmer mode (default) | Enumeration mode |
|---------|----------------------|------------------|
| Home | Own plots + capture CTA | Today’s member queue + “capture next” |
| Member context | Implicit (self) | Explicit switcher (name, village, member id) |
| Plot save | `farmerId` = active profile | `farmerId` = selected roster/provisional member |
| Assignments | N/A | Download active assignments; attach `assignmentId` on upload |

Backend assignment scope (`agent_plot_assignment`) and delegated plot registration (`farmerId !== authUserId`) already exist; mobile closes the loop.

### 2. Hybrid identity — roster + provisional

| Source | Offline storage | Sync behavior |
|--------|-----------------|---------------|
| **Prefetched roster** | `field_roster_entries` from campaign / CRM export | Plot POST uses known `farmerId` + optional `producerContactId` |
| **Provisional member** | Local UUID + minimum identity | Creates `farmer_profile` + `crm_contacts` (status `provisional` / `field_registered`); links on first plot sync |

**Minimum provisional fields:**

- Full name (required)
- Village / community (required)
- Phone **or** national ID (at least one required)
- Email (optional in field; collect when available)

**Dedup keys on sync (server authoritative):** phone, national ID, email (when present), plus geometry overlap and fuzzy name+village for desk review — never silent merge of two distinct members without operator or desk acknowledgement.

### 3. Two-layer geometry policy

| Layer | Rule | Product behavior |
|-------|------|------------------|
| **Compliance floor** | &lt; 4 ha → point; ≥ 4 ha → polygon (`POLYGON_REQUIRED_MIN_AREA_HA = 4`) | Enforced at save/upload (existing GEO-103) |
| **Cooperative ambition** | Encourage polygon even &lt; 4 ha when feasible | Default quick pin with prominent **“Map full boundary”** CTA; persist `captureIntent: eudr_minimum \| full_boundary` on `geometryCapture` metadata |

Tenant setting (future): `preferred_capture_mode = encourage_polygon | eudr_minimum_only`. Desk geometry approval (ADR-008 S6.4) remains the gate for shipment coverage when confidence is low.

### 4. One-trip evidence checklist

Each member visit runs a **linear wizard** (no plot-detail detours): geometry → ground-truth photos → tenure/attestation → done → next member.

No throughput SLA (plots/day). Success = correct multi-farmer capture in one offline session with duplicate guards and complete evidence per cooperative policy.

### 5. Duplicate detection

| When | Check |
|------|-------|
| **Offline, before save** | GEO-105 overlap with local plots; same member already mapped today; same phone/ID in local roster |
| **On sync** | Tenant plot overlap; provisional member matches existing CRM contact; set `duplicate_status` per spec §12 |

Hard block on geometry overlap; soft warn on probable duplicate member with “link existing / create anyway (desk review)”.

### 6. Confirm-gated district tile bootstrap (not install-time auto-download)

Tile packs are **tenant/campaign authoritative**; GPS/locale is hint only.

**Trigger:** after agent sign-in and tenant link (or when opening a mapping campaign pack), **not** on cold app install.

**Flow:**

1. Server returns `mapping_region_bbox` + label (e.g. “Copán, Honduras”) from tenant config or active campaign.
2. App pre-fills confirmation using coarse GPS/locale: *“Are your field operations in {label}?”*
3. User confirms **Yes** → show Wi‑Fi + storage estimate → download district pack → set active pack id.
4. User taps **No** → manual region picker or defer until campaign assigned.

**Explicit non-goals:**

- Silent country-wide download on first open
- Download without Wi‑Fi consent when pack exceeds mobile-data threshold (default: require Wi‑Fi for packs &gt; 50 MB)
- Replacing server bbox with IP geolocation alone

Farmer self-service users keep existing optional “near me” / manual offline maps; enumeration defaults to district pack.

## Consequences

- New field artifacts: roster SQLite table, enumeration session state, campaign tile manifest API — register in `farmer-artifact-sync-registry.md` when implemented.
- Dashboard: mapping campaign publish UI (roster export + region bbox + tile manifest).
- Analytics: enumeration funnel events (roster prefetch, provisional create, capture intent, tile bootstrap confirm/skip).
- Phase 1 can ship mobile queue + provisional identity before full campaign desk UI if backend exposes roster via existing campaign targets API.

## References

- `ADR-012-farmer-identity-email-primary-phone-fallback.md` — farmer outreach/auth (email-primary; phone/WhatsApp fallback; verified phone uniqueness)
- `FEAT-012-cooperative-enumeration-mode.md`
- `FEAT-002-mobile-field-capture.md` — agent assignment slices S1
- `ADR-008-capture-quality-tiers.md` — confidence + desk approval
- `product-os/04-quality/field-capture-quality-registry.md`
- `apps/offline-product/features/offlineTiles/offlineTiles.ts`
- `tracebud-backend/src/plots/plot-geometry-policy.ts` — 4 ha gate
- `BUILD_READINESS_ARTIFACTS.md` — Field Agent / Field Manager roles

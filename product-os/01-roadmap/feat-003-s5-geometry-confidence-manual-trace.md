# FEAT-003 S5 — Geometry confidence + manual satellite trace

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md` § plot geometry, `capture_method`, `area_source`
- `REQUIREMENTS.md` § IV (offline fail-safe manual trace on cached satellite)
- `product-os/02-features/FEAT-003-geospatial-mapping.md` (parent feature)
- `product-os/02-features/FEAT-002-mobile-field-capture.md` (walk / draw / pin flows)

## Goal

Help farmers capture **honest, auditable** plot boundaries when GPS is weak — without silently warping geometry to satellite imagery.

Deliver:

1. **Geometry confidence scoring** after walk, pin, or draw capture.
2. **Human-assisted manual trace** on satellite (online or offline tile pack) as the canonical fail-safe.
3. **Reviewer-visible confidence metadata** on upload (no auto-affine correction).

## Why it matters

- Tropical canopy multipath routinely yields 5–15 m horizontal error; walked polygons can be wrong by tens of meters.
- EUDR audits need defensible provenance: who placed the boundary and how.
- Silent satellite snapping would violate the 5% area-variance guard and blur liability.

## Non-goals (S5)

- Automatic affine / edge-snap correction of farmer geometry.
- Auto-merging or auto-clipping overlapping plots without human review.
- Cadastral parcel import (future slice).
- GFM crop-extent as stored boundary (screening input only, later).

## Users affected

| Role | Capability |
|------|------------|
| Farmer / field agent | See confidence after capture; get guided to manual trace or re-walk |
| Cooperative admin | See confidence tier on synced plots; triage low-confidence uploads |
| Exporter reviewer | Dashboard map overlay + optional “suggest revision” (human accept only) |

## Dependencies

- Offline tile packs (`features/offlineTiles/*`, Esri world imagery preset).
- Existing draw-on-map flow (`captureMethod = draw`, `manual_trace` mode).
- Backend geometry validation (`ST_MakeValid`, `GEO-101`/`GEO-102`, overlap checks `GEO-104`–`GEO-106`).
- Plot geometry supersession audit (`plot_geometry_superseded`).

---

## Execution phases

### Phase A — Confidence scoring (mobile, shipped first)

**Scope:** `plotGeometryConfidence.ts` + banner on walk/pin/draw pre-save.

| Input | Effect on score |
|-------|-----------------|
| `captureMethod = draw` | High base (human trace on satellite); self-intersect → low |
| Walk / centroid | Penalize precision >10 m / >15 m, sparse vertices per ha |
| Pin / point | Cap at moderate; emphasize uncertainty disc |
| Declared vs computed area | Warning when drift >3% (save still blocked at >5%) |

**UX**

- Show tier chip: Good / Fair / Low GPS accuracy.
- Low + walk → CTA: “Trace on map instead” (opens draw flow).
- Never block save solely on confidence (validation gates remain authoritative).

### Phase B — Offline manual trace hardening

**Status:** Shipped (2026-06-17)

| State | Behavior |
|-------|----------|
| Online | Esri satellite tiles (existing) |
| Offline + tile pack covers viewport | Allow draw; store `offlineTilesPackId` in audit payload |
| Offline + no pack | Block draw entry; link to offline maps download |

**New exception:** `GEO-108` OFFLINE_TRACE_TILES_REQUIRED.

**Implementation:** `manualTraceImagery.ts`, `pingFieldMapImagery.ts`, `/offline-maps` download screen, `WalkPerimeterScreen` gate on draw entry.

### Phase C — Upload metadata + dashboard visibility

**Scope:** Persist confidence on plot save / geometry revision.

Fields (local SQLite + backend geometry version metadata):

```json
{
  "geometryConfidenceTier": "moderate",
  "geometryConfidenceScore": 58,
  "horizontalUncertaintyM": 12.4,
  "captureMethod": "MOBILE_GPS | WEB_DRAW",
  "imagerySource": "esri_online | offline_pack",
  "offlineTilesPackId": "uuid-or-null"
}
```

Dashboard plot detail: badge on map hero (“Low GPS confidence — verify before seal”).

### Phase D — Reviewer assist (human-in-the-loop only)

**Scope:** Dashboard-only; not field auto-edit.

- Satellite underlay + optional vertex simplification **preview**.
- Reviewer clicks **Apply revision** → new `plot_geometry_versions` row with reason.
- Sync conflict rule unchanged: auto-accept only if overlap >95%.

---

## Permission and tenant boundary matrix

- **Farmer / agent:** score and advise within own-tenant plot capture only.
- **Admin / reviewer:** read confidence metadata for tenant-scoped plots; apply revisions only with `plot:geometry:revise` (or equivalent) role.
- **Cross-tenant:** confidence payloads never exposed without tenant claim (`TEN-001`).

## State transition matrix

| From | Event | To | Notes |
|------|-------|-----|-------|
| `capturing` | GPS walk in progress | `capturing` | Live precision chip (existing) |
| `capturing` | Stop walk / finish draw | `confidence_assessed` | Score computed client-side |
| `confidence_assessed` | User accepts boundary | `draft_saved` | Confidence snapshot stored on plot |
| `confidence_assessed` | User opens manual trace | `capturing` (draw) | `captureMethod → draw` |
| `draft_saved` | Upload succeeds | `validated` | Server re-validates; confidence advisory only |
| `validated` | Reviewer revision | `superseded` | New geometry version; reviewer actor |

No new canonical plot lifecycle enum — confidence is **metadata on capture**, not a compliance gate.

## Exception handling and recovery

| Code | When | Recovery |
|------|------|----------|
| `GEO-101` | Invalid polygon after save attempt | Re-walk or manual trace |
| `GEO-102` | `ST_MakeValid` area change >5% | Manual trace; do not auto-warp |
| `GEO-104`–`GEO-106` | Overlap / sliver (existing) | Human adjust boundary |
| `GEO-107` | Low confidence advisory on upload | Warning only; exporter review queue |
| `GEO-108` | Draw without offline tiles | Download pack or wait for connectivity |

## Analytics events

| Event | When | Properties |
|-------|------|------------|
| `geometry_confidence_assessed` | After capture stop / before save | `tier`, `score`, `captureMethod`, `plotKind` |
| `geometry_confidence_cta_clicked` | User taps trace-on-map / retry | `recommendedAction`, `tier` |
| `manual_trace_started` | Enter draw mode from footer or CTA | `source` (`footer` \| `confidence_cta`), `offline` |
| `manual_trace_saved` | Draw boundary saved | `vertexCount`, `areaHa`, `offlinePackId?` |
| `geometry_low_confidence_saved` | Save despite low tier | `tier`, `score`, `captureMethod` |
| `plot_geometry_revision_applied` | Dashboard reviewer applies revision | `plotId`, `reviewerAssist` |

Audit log (local + server where applicable):

- `plot_geometry_capture_confidence_recorded`
- `plot_geometry_manual_trace_saved`

## Acceptance criteria

### Phase A

- [ ] Walk with simulated 16 m precision shows **Fair** or **Low** tier and manual-trace CTA.
- [ ] Draw on valid polygon shows **Good** tier even when GPS precision is poor.
- [ ] Pin plot never shows **Good** tier (uncertainty explicit).
- [ ] Confidence does not bypass `hasSelfIntersection` or 5% area discrepancy save blocks.
- [ ] Unit tests for `assessGeometryConfidence` (≥4 cases).

### Phase B

- [x] Offline draw blocked without tile pack; clear copy + link to `/offline-maps`.
- [x] Offline draw with covering pack succeeds; `offlineTilesPackId` in audit payload (`plot_manual_trace_saved`).

### Phase C

- [x] Uploaded plot exposes confidence fields via `GET /v1/plots/:id/map-preview` (`geometry_capture`).
- [x] Dashboard map hero shows low/moderate confidence advisory badges.

### Phase D

- [x] Reviewer revision creates superseded geometry version with actor + reason (`plot_geometry_superseded`, `reviewerAssist: true`).
- [x] No field-app auto-apply of suggested edges (dashboard-only panel; human clicks Apply).

## v1.6 architecture constraints

| Constraint | S5 handling |
|------------|-------------|
| `GEOGRAPHY` storage | Unchanged; confidence is metadata |
| `ST_MakeValid` + 5% guard | Unchanged; no silent snap |
| HLC offline sync | Confidence snapshot included in plot payload; LWW unchanged |
| Lineage O(1) | No traversal changes |
| TRACES chunking | N/A |
| GDPR shredding | Confidence metadata shredded with plot; audit refs preserved |

## Risks

- Farmers ignore low-confidence warnings → mitigate with exporter dashboard filter.
- Offline pack stale vs current imagery → store pack `createdAt` on audit row.
- Over-trusting manual trace → still subject to overlap / area guards.

## Status

**Phase A shipped** — confidence module + mobile banner (2026-06-17).  
**Phase B shipped** — offline manual-trace imagery gate + `/offline-maps` download (2026-06-17).  
**Phase C shipped** — geometry capture metadata persistence + dashboard map-hero badge (2026-06-17).

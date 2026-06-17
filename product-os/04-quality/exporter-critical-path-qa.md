# Exporter critical-path QA

Last updated: 2026-06-16  
Scorecard ref: `product-os/04-quality/dashboard-a-plus-scorecard.md` (Exporter section)

## Purpose

Manual acceptance for exporter **A+** critical path on a **real tenant** (not demo fixtures). Code gates below are implemented in dashboard; this checklist confirms end-to-end behavior with live backend data.

## Preconditions

- Exporter tenant with `exporter` or `agent` active role
- Backend reachable (`TRACEBUD_BACKEND_URL` configured for dashboard)
- At least one cooperative/producer relationship or ability to create producers
- Browser session with completed onboarding (non-virgin workspace preferred for seal path)

## Critical path ★

### 1. Producer → plot → batch → shipment (lineage)

| Step | Action | Pass criteria |
|------|--------|---------------|
| 1.1 | Add producer (`/farmers/new`) | Producer appears in producers list |
| 1.2 | Register plot linked to producer | Plot visible on plot detail; geometry/tenure panels load |
| 1.3 | Record harvest batch (`/harvests`) | Batch ties to plot; weight and commodity captured |
| 1.4 | Create shipment/package (`/packages`) | Package in `DRAFT`; associated plots/producers visible on detail |
| 1.5 | Open package detail lineage section | Plot and producer associations match field data; **Lineage summary** card shows intact/missing state |

### 2. Readiness blockers before seal ★

| Step | Action | Pass criteria |
|------|--------|---------------|
| 2.1 | Open `DRAFT` or `READY` package with known blockers | `BlockerCard` visible with preflight title and blocker list |
| 2.2 | Header **Assemble Shipment** control | **Disabled** while blockers present or readiness loading; tooltip explains resolve-first |
| 2.3 | **Generate filing artifacts** / **Submit** CTAs | Disabled when blockers present |
| 2.4 | Resolve blockers (compliance run, plot fixes) | Blocker card clears; assemble link becomes active |
| 2.5 | `/packages/{id}/assemble` seal step | Seal CTA disabled until `readinessBlockers.length === 0` |

### 3. Overview attention (exporter home)

| Step | Action | Pass criteria |
|------|--------|---------------|
| 3.1 | Tenant with `blocking_issues_count > 0` | North-star KPI shows **Blocking issues** count; CTA → `/compliance/issues` |
| 3.2 | No blockers, `READY > 0` | North-star shows **Shipments ready to seal**; CTA → packages filtered `READY` |
| 3.3 | KPI strip | Blocking issues and ready-to-seal counts match backend metrics |

### 4. Importer-handoff language ★

| Step | Action | Pass criteria |
|------|--------|---------------|
| 4.1 | Package detail filing workflow hint (exporter role) | Mentions seal + hand off to importer (not TRACES filing) |
| 4.2 | Preflight blocker description | Uses "sealing or handing off" wording for exporter |
| 4.3 | Assemble subtitle (`/packages/{id}/assemble`) | Exporter copy references importer EU filing handoff |
| 4.4 | After seal success toast | Handoff-oriented success message (not importer TRACES language) |

## Regression smoke (5 min)

- [ ] Virgin exporter tenant shows virgin-state panel + add-producer CTA
- [ ] Mature exporter home loads without console errors
- [ ] `/compliance/issues` loads from north-star CTA
- [ ] Locale off (`t` undefined): English fallbacks on package detail and dashboard

## Sign-off

| Field | Value |
|-------|-------|
| Tenant ID | |
| Tester | |
| Date | |
| Result | Pass / Fail |
| Notes | |

When all ★ rows pass, update scorecard exporter **Daily use ★** to `2` and check critical-path boxes in `dashboard-a-plus-scorecard.md`.

# Dashboards

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Goal

Deliver v1 behavior for dashboards aligned to canonical docs.

## Why it matters

Enables core EUDR operating loop without external tooling.

## Users affected

Use canonical role matrix in `BUILD_READINESS_ARTIFACTS.md`.

## Scope

Operational org/sponsor readiness and risk views.

## Non-goals

Anything outside v1 boundaries in `MVP_PRD.md`.

## Dependencies

See `product-os/01-roadmap/dependency-map.md`.

## Key entities

Use entity model in `MVP_PRD.md` and `PRODUCT_PRD.md`.

## UX / operational notes

Use journey and JTBD constraints from `JTBD_PRD.md` and `BUILD_READINESS_ARTIFACTS.md`.

## Tasks checklist

- [ ] Confirm permissions and tenant boundaries
- [ ] Confirm state transitions
- [ ] Confirm exception handling and recovery
- [ ] Confirm analytics event coverage
- [ ] Confirm acceptance criteria mapping
- [ ] Confirm v1.6 architecture constraints for touched areas (spatial, HLC sync, lineage, TRACES chunking, GDPR shredding)
- [ ] Update status docs

## Acceptance criteria

Reference domain criteria in `product-os/04-quality/acceptance-criteria.md`.

## Error / edge cases

Reference canonical catalog in `product-os/04-quality/exception-catalog.md`.

## Analytics notes

Reference canonical event plan in `product-os/04-quality/event-tracking.md`.

- Founder OS Lite analytics coverage now includes:
  - daily outreach plan bootstrap action emission (`REQUEST_CAMPAIGN_STARTED`)
  - weekly content plan bootstrap action emission (`REQUEST_CAMPAIGN_STARTED`)
  - outreach daily-action completion emission (`REQUEST_CAMPAIGN_RESPONSE_RECEIVED`)
- Cadence visibility includes streak signals on `Today`:
  - consecutive weekdays meeting outreach target (3 completed actions/day)
  - consecutive weeks meeting content target (2 LinkedIn posts/week)

## Risks

- Scope creep beyond MVP boundary
- Missing dependency finalization

## Open questions

- [ ] Provider/protocol choices finalized where needed

## Status

In progress (Founder OS Lite analytics + cadence visibility slice delivered; coverage tests pending)

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated

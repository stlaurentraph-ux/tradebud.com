# EUDR rules engine

## Canonical sources

- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Goal

Deliver v1 behavior for eudr rules engine aligned to canonical docs.

## Why it matters

Enables core EUDR operating loop without external tooling.

## Users affected

Use canonical role matrix in `BUILD_READINESS_ARTIFACTS.md`.

## Scope

Completeness + blocker/warning policy checks for v1 EUDR.

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
- [ ] Update status docs

## Acceptance criteria

Reference domain criteria in `product-os/04-quality/acceptance-criteria.md`.

## Error / edge cases

Reference canonical catalog in `product-os/04-quality/exception-catalog.md`.

## Analytics notes

Reference canonical event plan in `product-os/04-quality/event-tracking.md`.

## Risks

- Scope creep beyond MVP boundary
- Missing dependency finalization

## Open questions

- [ ] Provider/protocol choices finalized where needed

## Status

Planned

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated

# Multi-tenant admin

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `MVP_PRD.md`
- `PRODUCT_PRD.md`
- `JTBD_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Goal

Deliver v1 behavior for multi-tenant admin aligned to canonical docs.

## Why it matters

Enables core EUDR operating loop without external tooling.

## Users affected

Use canonical role matrix in `BUILD_READINESS_ARTIFACTS.md`.

## Scope

Tenanting, RBAC, delegated admin, tenant switch context.

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

- Inbox proxy routes must fail closed when backend is unavailable (`503`) rather than silently reading/writing local in-memory data.
- Tenant-bound operations (`list`, `respond`, `bootstrap`) must remain signed-claim backed end-to-end (dashboard API proxy to backend controller/service).
- DB-backed inbox controller integration coverage now includes tenant-claim denial/allow and exporter bootstrap role policy assertions (`src/inbox/inbox.controller.int.spec.ts`, env-gated by `TEST_DATABASE_URL`).
- Backend integration scripts now auto-load `TEST_DATABASE_URL` from root `.env.local` when missing in shell (`scripts/run-with-root-test-db.mjs`) for consistent local DB-backed execution.

## Analytics notes

Reference canonical event plan in `product-os/04-quality/event-tracking.md`.

## Risks

- Scope creep beyond MVP boundary
- Missing dependency finalization

## Open questions

- [ ] Provider/protocol choices finalized where needed

## Status

In progress (dashboard inbox local fallback removal + backend-only enforcement slice)

## Definition of done

- Behavior implemented and tested
- Feature checklist completed
- Quality docs/logs updated

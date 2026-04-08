# build-feature

Read canonical docs first, then feature/workflow/quality docs, implement only requested slice, then update status/docs.

## Mandatory read-order

1. `TRACEBUD_V1_2_EUDR_SPEC.md`
2. `REQUIREMENTS.md`
3. `MVP_PRD.md`
4. `PRODUCT_PRD.md`
5. `JTBD_PRD.md`
6. `BUILD_READINESS_ARTIFACTS.md`

## Build checklist (must pass)

- Confirm tenant isolation and explicit role-scoped permissions.
- Confirm canonical state transitions and exception recovery behavior.
- Define analytics events and acceptance criteria for the slice.
- If spatial logic is touched: `GEOGRAPHY` storage, `ST_MakeValid`, and area variance guard are enforced.
- If lineage is touched: runtime traversal remains O(1) via materialized lineage fields.
- If offline sync is touched: HLC ordering + idempotency keys are enforced; no wall-clock trust.
- If TRACES integration is touched: payload size/vertex chunking and parent-child reference reconciliation are handled.
- If producer deletion/consent revocation is touched: cryptographic shredding path preserves audit retention requirements.

## Required doc updates after implementation

- Update relevant `product-os/02-features/*.md`.
- Update `product-os/06-status/daily-log.md`.
- Update `product-os/06-status/done-log.md`.
- Update `product-os/06-status/current-focus.md`.
- Update ADR(s) when architecture decisions are introduced or changed.

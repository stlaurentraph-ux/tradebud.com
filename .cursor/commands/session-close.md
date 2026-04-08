# session-close

Update daily log, blockers, done log, and current focus before ending session.

## Mandatory read-order

1. `TRACEBUD_V1_2_EUDR_SPEC.md`
2. `REQUIREMENTS.md`
3. `MVP_PRD.md`
4. `PRODUCT_PRD.md`
5. `JTBD_PRD.md`
6. `BUILD_READINESS_ARTIFACTS.md`

## Closeout checklist

- Append concise entry to `product-os/06-status/daily-log.md` (focus, files changed, decisions, risks, blockers, next step).
- Update `product-os/06-status/done-log.md` for completed slices.
- Update `product-os/06-status/current-focus.md` with next executable priorities.
- Note any architecture decisions that require ADR updates.
- If v1.6 constraints were touched, explicitly record validation status for spatial, HLC, lineage, TRACES chunking, and GDPR shredding.

# ship-check

Run release checklist and produce GO/NO-GO with blockers.

## Mandatory read-order

1. `TRACEBUD_V1_2_EUDR_SPEC.md`
2. `REQUIREMENTS.md`
3. `MVP_PRD.md`
4. `PRODUCT_PRD.md`
5. `JTBD_PRD.md`
6. `BUILD_READINESS_ARTIFACTS.md`

## Release gate checklist

- Core quality gates pass: permissions, transitions, exceptions, analytics, acceptance criteria.
- No unresolved blocking compliance issues.
- Submission flows are auditable and idempotent end-to-end.
- Required status/docs/ADR updates are completed.

### v1.6 critical gates

- Spatial: `GEOGRAPHY` correctness and polygon validation enforcement confirmed.
- Offline: HLC-based conflict strategy verified in affected paths.
- Lineage: O(1) runtime traversal confirmed for batch/shipment readiness.
- TRACES: payload chunking behavior verified for large datasets.
- GDPR: cryptographic shredding path tested for retention-safe anonymization.

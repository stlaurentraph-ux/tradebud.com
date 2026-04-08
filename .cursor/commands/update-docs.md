# update-docs

Synchronize feature, roadmap, quality, ADR, and status docs after behavior changes.

## Mandatory read-order

1. `TRACEBUD_V1_2_EUDR_SPEC.md`
2. `REQUIREMENTS.md`
3. `MVP_PRD.md`
4. `PRODUCT_PRD.md`
5. `JTBD_PRD.md`
6. `BUILD_READINESS_ARTIFACTS.md`

## Documentation synchronization checklist

- Update impacted feature docs under `product-os/02-features/`.
- Update quality artifacts when acceptance criteria or risk handling changed.
- Update status logs (`daily-log`, `done-log`, `current-focus`).
- Update ADRs when architecture choices change.
- Include a short "spec alignment" note that references affected section(s) in `TRACEBUD_V1_2_EUDR_SPEC.md`.
- For v1.6 architecture changes, explicitly mention: spatial (`GEOGRAPHY`), HLC sync, materialized lineage, TRACES chunking, GDPR shredding.

# Tracebud Product OS

Repo-native operating system for product, architecture, delivery, and implementation.

## Canonical sources (read first)

1. `TRACEBUD_V1_2_EUDR_SPEC.md` (canonical spec file; currently contains v1.6 content)
2. `REQUIREMENTS.md` (strategy, vision, positioning)
3. `MVP_PRD.md` (v1 scope boundaries)
4. `PRODUCT_PRD.md` (detailed product requirements)
5. `JTBD_PRD.md` (role workflows and activation/remediation jobs)
6. `BUILD_READINESS_ARTIFACTS.md` (states, entitlements, exceptions, events, acceptance)

If any document conflicts with these, canonical sources win.

## v1.6 enterprise architecture guardrails (must be reflected in implementation)

- Spatial correctness: compliance geometry stored as `GEOGRAPHY`; area derived with spheroidal math.
- Geometry integrity: polygon ingestion uses `ST_MakeValid`; reject excessive correction variance.
- Lineage performance: runtime lineage traversal remains O(1) through materialized lineage fields.
- Offline sync integrity: HLC ordering and idempotency-first conflict strategy.
- TRACES resilience: automatic payload chunking for size/vertex limits with parent shipment linkage.
- GDPR + retention: cryptographic shredding for PII while preserving immutable audit references.

### Filename aliases used in prompts

- `requirement.md` => `REQUIREMENTS.md`
- `PRODUCT_PDR.md` => `PRODUCT_PRD.md`

## How this replaces external PM tools

- Roadmap: `product-os/01-roadmap/`
- Features: `product-os/02-features/`
- Workflows: `product-os/03-workflows/`
- Quality gates: `product-os/04-quality/`
- Decisions (ADR): `product-os/05-decisions/`
- Execution status: `product-os/06-status/`

## Working loop in Cursor

1. Read canonical sources in order above.
2. Open `product-os/06-status/current-focus.md`.
3. Pick feature from `product-os/01-roadmap/master-roadmap.md`.
4. Use `.cursor/commands/build-feature.md`.
5. Review with `.cursor/commands/review-feature.md`.
6. Close session with `.cursor/commands/session-close.md`.

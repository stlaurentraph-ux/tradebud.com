# Current Focus

## Work now

- Execute P0 gates from `product-os/01-roadmap/v1-6-spec-execution-board.md` before engineering kickoff (`P0-01` contradiction pass, `P0-02` legal memo, `P0-03` pilot setup).
- Complete P0-01 contradiction pass sequencing: Pass 1-5 complete; CL-001..CL-020 normalized and marked resolved in contradiction log.
- Execute P1 external decision gates (cloud region, TRACES WSDL, GeoID access, legal sign-offs).
- Convert Section 32.8 endpoint contract catalog into implementation artifacts (OpenAPI draft at `docs/openapi/tracebud-v1-draft.yaml`; pass 2 tightened shipment/sync/portability/export/billing/webhook payloads + explicit conflict/422 responses; next: add endpoint-level examples and role-scope extensions).
- Replace provisional benchmark seed values in spec Section 37 with source-verified FAOSTAT/USDA/national statistics data.
- Start TB-V16-003 migration execution in staging (`GEOGRAPHY` add/backfill/index + parity checks).
- Start FEAT-001 implementation planning with explicit v1.6 quality gates.
- Verify existing code paths against canonical role/state/exception models and v1.6 architecture rules.

## Priority migration lanes (v1.6)

- Spatial lane: enforce `GEOGRAPHY` + `ST_MakeValid` + area variance guard.
- Sync lane: enforce HLC conflict ordering and idempotency behavior.
- Lineage lane: enforce O(1) traversal via materialized lineage fields.
- TRACES lane: enforce payload chunking strategy and multi-reference reconciliation.
- GDPR lane: enforce cryptographic shredding with retention-safe audit preservation.

## Open first

- `product-os/02-features/FEAT-001-multi-tenant-admin.md`

## Then

- `product-os/01-roadmap/dependency-map.md`
- `product-os/04-quality/acceptance-criteria.md`
- `product-os/05-decisions/ADR-001-tenant-model.md`

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
- Continue dashboard-product hardening: replace mock cooperative inbox requests with tenant-isolated backend APIs and preserve audit event mappings.
- Keep `useInboxRequests` page contract stable while swapping `request-service` local storage implementation to backend endpoints.
- Replace dashboard in-memory inbox API route backing with persisted `tracebud-backend` request entities and tenant-authenticated service calls.
- Harden backend inbox endpoints with authenticated tenant claim checks and migrate snapshot payload storage to dedicated request tables.
- Execute 1-week auth/tenant hardening plan in `product-os/01-roadmap/dashboard-auth-tenant-hardening-week-plan.md` (TB-DBX-001..004).
- TB-DBX-001 complete: signed tenant-claim enforcement and auth-semantic pass-through in dashboard inbox proxy.
- TB-DBX-002 complete: dedicated tenant-scoped inbox request/event tables and indexes now back list/respond/bootstrap operations.
- TB-DBX-003 test harness complete: inbox tenant/state and claim-enforcement tests added.
- TB-DBX-004 complete: MVP feature fences now gate deferred routes at navigation and route-entry levels.
- TB-DBX-004 assertions complete: dashboard Vitest checks now cover deferred-route inaccessibility and feature-flag enable behavior.
- TB-DBX-004 CI lane complete: dashboard `npm test` now runs in root CI workflow.
- Next: enforce `TEST_DATABASE_URL` execution in CI and extend dashboard/integration coverage for additional deferred routes and role-path scenarios.
- Report role-boundary hardening complete: backend report exports now enforce exporter-only access with dedicated controller regression tests; next is extending tenant-boundary denial tests into additional backend modules.
- Harvest/plots tenant-boundary hardening in progress: farmer-role ownership checks added for farmerId/plotId scoped endpoints and package detail/export surfaces tightened to exporter role; next is adding integration coverage with real tenant-linked fixture data.
- Harvest/plots tenant-boundary integration slice added: env-gated ownership integration tests now validate farmer/profile and plot ownership joins in isolated DB schema fixtures; next is executing these tests in CI with `TEST_DATABASE_URL` and extending to controller + API-level integration assertions.
- Harvest/plots controller-level ownership integration added: DB-backed controller integration assertions now cover deny/allow for farmer scoped voucher/plot-list/plot-update paths; next is wiring mandatory CI execution evidence for this specific slice under `TEST_DATABASE_URL`.
- Ownership CI execution gate added: backend CI now runs a dedicated required ownership integration step; next is extending this explicit-gate pattern to broader tenant-claim API integration slices.
- Signed tenant-claim enforcement expanded beyond inbox to harvest/plots/reports controllers; next is extending these checks to any remaining authenticated endpoints and adding DB-backed API integration coverage for package/report export paths.
- Signed tenant-claim closure for authenticated controllers completed (including `audit`); next is DB-backed API integration coverage for package/report export paths under tenant-claim policy.
- DB-backed package/report export access integration coverage now includes package list/detail/TRACES plus both report endpoints (`plots`, `harvests`) under tenant-claim + role policy; CI now also hard-fails on skipped ownership suites, next is validating first non-skipped run evidence.
- Release QA evidence for ownership/access lane is now populated with CI run URL + artifact proof (`product-os/04-quality/release-qa-evidence.md`) and reviewer PASS signoff; CI runtime modernization (issue #22) implementation is in progress to remove Node 20 deprecation warnings.
- Founder OS foundation complete at schema/spec layer: Supabase migrations/functions/seeds and marketing lead mirror are ready; next is deployment validation and dashboard CRM/content UI scaffolding.
- Apply Founder OS SQL artifacts in Supabase and validate `generate_daily_actions` + `generate_content_tasks` outputs against real leads/content data.
- Founder OS phase 4 scaffold complete in dashboard app (`/crm/*`, `/content/*` + API routes); next step is hardening write-action permissions and adding analytics event coverage for founder action tracking.
- Founder OS Lite execution slice complete: `Today` flow + target bootstrap + exchange logging shipped; next step is analytics event instrumentation for bootstrap/action completion and cadence streak visibility.

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

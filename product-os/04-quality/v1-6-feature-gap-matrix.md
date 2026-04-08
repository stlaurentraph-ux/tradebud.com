# v1.6 Feature Gap Matrix

## Purpose

Translate v1.6 architecture requirements into an execution-priority matrix across `FEAT-001` to `FEAT-010`.

## Canonical sources

- `TRACEBUD_V1_2_EUDR_SPEC.md` (contains v1.6 content)
- `product-os/02-features/*.md`
- `product-os/04-quality/*.md`

## Gate legend

- `SPATIAL`: `GEOGRAPHY`, `ST_MakeValid`, area variance guard
- `HLC`: Hybrid Logical Clock sync ordering and idempotent replay
- `LINEAGE`: O(1) traversal via materialized lineage (for example `root_plot_ids`)
- `TRACES`: payload chunking and multi-reference reconciliation
- `GDPR`: cryptographic shredding with retention-safe audit continuity

## Priority scale

- `P0`: required for core compliance correctness or legal/audit safety
- `P1`: required for enterprise reliability and scale
- `P2`: required for operational maturity and optimization

## Matrix

| Feature | Primary v1.6 gates | Priority | Gap summary | First implementation slices |
|---|---|---|---|---|
| `FEAT-001-multi-tenant-admin` | GDPR | P1 | Tenant/RBAC scope exists; explicit shredding governance and permission model for anonymized records likely missing. | Add anonymized-record visibility policy, role-scoped access checks, and audit events for erasure workflows. |
| `FEAT-002-mobile-field-capture` | SPATIAL, HLC | P0 | Offline capture is core, but v1.6 clock strategy and geometry auto-fix/reject behavior are high-risk if not implemented. | Add HLC in sync payload, server-side HLC fallback logic, polygon `ST_MakeValid` pipeline, >5% variance rejection UX. |
| `FEAT-003-geospatial-mapping` | SPATIAL | P0 | Geometry-heavy feature must migrate to `GEOGRAPHY` and enforce spheroidal area correctness. | Migrate schema/queries to `GEOGRAPHY`, enforce make-valid path, add area-variance checks and reviewer workflow. |
| `FEAT-004-eudr-rules-engine` | LINEAGE, GDPR | P1 | Rules correctness depends on reliable lineage references and handling anonymized producer records. | Add rules compatibility for materialized lineage fields and anonymized producer semantics. |
| `FEAT-005-risk-scoring` | SPATIAL | P0 | Risk outputs depend on correct geometry math and valid shape handling; distortion risk is material. | Ensure risk engine consumes `GEOGRAPHY`, includes correction metadata, and preserves explainability chain. |
| `FEAT-006-filing-middleware` | TRACES, LINEAGE | P0 | Filing is legal critical path; payload overflow and deep lineage traversal can block submissions at scale. | Implement payload preflight estimator, chunk planner, chunk submission orchestration, reference reconciliation. |
| `FEAT-007-chat-threads` | GDPR | P2 | Collaboration flow should support anonymized producer references without leaking PII. | Add anonymized entity rendering and permission-safe message context filters. |
| `FEAT-008-dashboards` | HLC, TRACES, GDPR | P2 | Ops dashboards need new telemetry for chunking, sync ordering fallbacks, and shredding outcomes. | Add KPI panels for HLC conflict rate, chunked DDS rate, shredding backlog/SLA. |
| `FEAT-009-integrations` | TRACES, HLC | P1 | External API/webhook contracts must represent chunked filings and conflict-safe event sequencing. | Extend webhook schema and API docs for chunk group IDs, multi-reference results, deterministic event ordering. |
| `FEAT-010-workflow-templates` | GDPR, LINEAGE | P2 | Templates should include steps for appeals, anonymization effects, and lineage materialization dependencies. | Add template stages/checklists for yield appeal, erasure review, lineage materialization readiness checks. |

## Suggested implementation waves

### Wave 1 (P0, compliance-critical)

1. `FEAT-002-mobile-field-capture`
2. `FEAT-003-geospatial-mapping`
3. `FEAT-005-risk-scoring`
4. `FEAT-006-filing-middleware`

### Wave 2 (P1, enterprise hardening)

1. `FEAT-001-multi-tenant-admin`
2. `FEAT-004-eudr-rules-engine`
3. `FEAT-009-integrations`

### Wave 3 (P2, operational maturity)

1. `FEAT-007-chat-threads`
2. `FEAT-008-dashboards`
3. `FEAT-010-workflow-templates`

## Definition of matrix completion

- Each feature has an issue/epic linked to at least one v1.6 gate.
- Each P0 feature has implementation owner, target sprint, and explicit acceptance tests.
- Release check includes v1.6 gate verification for all shipped slices.

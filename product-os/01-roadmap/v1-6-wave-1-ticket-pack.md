# v1.6 Wave 1 Ticket Pack (Sprint-Ready)

## Scope

Wave 1 targets the P0 compliance-critical slices from `product-os/04-quality/v1-6-feature-gap-matrix.md`:

- `FEAT-002` Mobile field capture
- `FEAT-003` Geospatial mapping
- `FEAT-005` Risk scoring
- `FEAT-006` Filing middleware

## Sprint objective

Reduce legal/compliance risk by implementing v1.6-critical architecture controls:

- spatial correctness (`GEOGRAPHY`, `ST_MakeValid`, area-variance reject)
- offline conflict integrity (HLC ordering + idempotency)
- TRACES resilience (payload chunking + multi-reference reconciliation)

## Ticket format

- `Owner`: assign person or team
- `Estimate`: story points or ideal days
- `Dependencies`: blocking ticket IDs
- `Acceptance`: must be testable and auditable

---

## TB-V16-001 — HLC sync envelope and server ordering

- **Feature:** `FEAT-002`
- **Priority:** P0
- **Owner:** TBD
- **Estimate:** TBD
- **Dependencies:** none

### Scope

- Add `hlc_timestamp` to offline sync envelope.
- Enforce server-owned HLC ordering semantics.
- Keep `client_event_id` idempotency behavior mandatory.

### Acceptance

- Client sends `hlc_timestamp` and `client_event_id` for all sync mutations.
- Server rejects malformed HLC with explicit error.
- Server falls back to ingestion-time LWW when HLC is invalid.
- Replay with same `client_event_id` is idempotent.
- Audit/sync conflict records capture resolution strategy.

### Test plan

- Corrupt HLC payload -> fallback path executed.
- Duplicate event replay -> no duplicate mutation.
- Out-of-order events -> deterministic final state.

---

## TB-V16-002 — Polygon validity pipeline with variance guard

- **Feature:** `FEAT-003`
- **Priority:** P0
- **Owner:** TBD
- **Estimate:** TBD
- **Dependencies:** none

### Scope

- Route polygon ingestion through `ST_MakeValid`.
- Reject submissions where correction changes area by more than 5%.
- Return actionable user remediation feedback.

### Acceptance

- All new polygons pass make-valid pipeline before persistence.
- Area variance threshold check is enforced and configurable by policy value.
- Rejection response includes cause and next action.
- Acceptance and rejection events are emitted for audit.

### Test plan

- Self-intersecting polygon with low correction variance -> accepted.
- Self-intersecting polygon with high variance -> rejected.
- Valid polygon -> unchanged persistence path.

---

## TB-V16-003 — Spatial storage migration to GEOGRAPHY

- **Feature:** `FEAT-003` and `FEAT-005`
- **Priority:** P0
- **Owner:** TBD
- **Estimate:** TBD
- **Dependencies:** TB-V16-002
- **Migration artifact:** `tracebud-backend/sql/tb_v16_003_geography_migration.sql`
- **Decision record:** `product-os/05-decisions/ADR-003-geography-migration-strategy.md`

### Scope

- Migrate compliance-critical spatial fields from `GEOMETRY` to `GEOGRAPHY`.
- Update area calculations to spheroidal math path.
- Backfill existing records safely and verify parity thresholds.

### Acceptance

- Schema uses `GEOGRAPHY` for plot and geometry version storage.
- Area calculations use geography-safe functions.
- Migration runbook includes rollback and integrity checks.
- No tenant boundary leakage during migration or backfill.

### Test plan

- Migration on staging snapshot completes without data loss.
- Randomized area-delta sampling stays within accepted tolerance bands.
- Risk engine reads migrated fields without regression.

---

## TB-V16-004 — Risk engine compatibility with corrected geometry

- **Feature:** `FEAT-005`
- **Priority:** P0
- **Owner:** TBD
- **Estimate:** TBD
- **Dependencies:** TB-V16-003

### Scope

- Ensure risk screening pipeline consumes `GEOGRAPHY` outputs.
- Persist explainability fields for correction metadata.
- Preserve deterministic output history with dataset/version linkage.

### Acceptance

- Risk runs produce identical result class for unchanged valid geometry.
- Corrected-geometry runs annotate correction path in explainability payload.
- Dataset/profile versions are stored for every run.

### Test plan

- Run baseline and migrated geometry through same datasets -> expected parity.
- Run corrected polygon -> explainability includes correction metadata.

---

## TB-V16-005 — DDS payload chunk planner

- **Feature:** `FEAT-006`
- **Priority:** P0
- **Owner:** TBD
- **Estimate:** TBD
- **Dependencies:** none

### Scope

- Build pre-submit estimator for XML size and vertex counts.
- Split oversized submissions into chunk plan before transmission.
- Preserve one internal shipment parent with multiple TRACES references.

### Acceptance

- Estimator blocks single-envelope submission when limits exceeded.
- Chunk planner produces deterministic chunk group and ordering.
- Parent shipment can reconcile child submission statuses and references.
- Retry logic remains idempotent per chunk.

### Test plan

- Synthetic large shipment exceeds thresholds -> chunk plan generated.
- Partial chunk failures -> retry and reconciliation succeed.
- Final status aggregation matches all chunk outcomes.

---

## TB-V16-006 — Filing state and reference reconciliation for chunked DDS

- **Feature:** `FEAT-006`
- **Priority:** P0
- **Owner:** TBD
- **Estimate:** TBD
- **Dependencies:** TB-V16-005

### Scope

- Extend state model to represent multi-reference DDS lifecycle.
- Track submission/accept/reject per chunk and aggregate at shipment level.
- Preserve immutable snapshots and auditable supersession behavior.

### Acceptance

- `shipment_headers` has reliable parent view of chunked DDS execution.
- All returned TRACES references are persisted and queryable.
- Rejection/timeout paths create actionable remediation tasks.
- Audit log reconstructs full chunk submission timeline.

### Test plan

- Mixed chunk outcomes (accepted/rejected/pending) -> correct aggregate state.
- Withdrawal/amendment path respects accepted snapshot immutability.

---

## Execution order (recommended)

1. TB-V16-001
2. TB-V16-002
3. TB-V16-003
4. TB-V16-004
5. TB-V16-005
6. TB-V16-006

## Release gate for Wave 1

Wave 1 closes only when all tickets meet:

- permissions/state/exception/analytics acceptance gates
- v1.6 architecture gates in `product-os/04-quality/release-checklist.md`
- status and docs updates in `product-os/06-status/*`

# ADR-003: GEOGRAPHY Migration Strategy (TB-V16-003)

## Status

Accepted (implementation in progress)

## Context

v1.6 requires spheroidal-accurate area handling and consistency across ingestion, risk, and filing flows. Existing implementation relies on `geometry` columns and ad-hoc `::geography` casts.

This creates operational risk:

- inconsistent query behavior by feature
- migration uncertainty for historical rows
- weaker index strategy for distance/area-heavy workloads

## Decision

Adopt an additive migration to introduce explicit `geography` columns and backfill from legacy `geometry` data.

### Chosen approach

1. Add `geography` columns to plot-related tables (non-destructive).
2. Backfill from `geometry::geography`.
3. Recompute area fields from `ST_Area(geography)`.
4. Add GIST indexes on geography columns.
5. Keep legacy geometry during transition for rollback safety.
6. Move service logic to geography-first reads after backfill validation.
7. Drop legacy geometry only after at least one full release cycle.

## Consequences

### Positive

- consistent area precision and semantics
- cleaner query patterns for risk and proximity checks
- reduced future migration debt

### Trade-offs

- temporary dual-column complexity
- backfill and validation execution overhead
- requires release choreography across API and data layers

## Operational guardrails

- Run migration in staging snapshot before production.
- Verify random sample parity for area calculations.
- Monitor query latency before and after index creation.
- Keep rollback path by preserving legacy geometry columns initially.

## References

- `TRACEBUD_V1_2_EUDR_SPEC.md`
- `tracebud-backend/sql/tb_v16_003_geography_migration.sql`
- `product-os/01-roadmap/v1-6-wave-1-ticket-pack.md`

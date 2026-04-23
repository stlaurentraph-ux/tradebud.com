# Acceptance Criteria

## Canonical source

- `BUILD_READINESS_ARTIFACTS.md` (Acceptance pack)

## Rule

This file indexes acceptance criteria by domain. Canonical wording stays in pillar doc.

## Domains

- Identity and tenanting
- Supplier onboarding
- Mobile field capture
- Plot review
- Shipment dossier
- Risk scoring
- Filing
- Chat and issues
- Sponsor oversight
- Audit and export
- Spatial integrity (`GEOGRAPHY`, polygon validity, area variance guard)
- Offline sync integrity (HLC ordering, idempotency, conflict reconciliation)
- Lineage performance (materialized lineage for O(1) runtime traversal)
- TRACES payload resilience (chunking by size and vertex constraints)
- GDPR retention-safe erasure (cryptographic shredding with audit preservation)
- MVP readiness and phased release gating (Section 51)
- Commodity-specific due diligence coverage and seed completeness (Section 52)
- Security program controls and credential exposure runbook coverage (Section 48)
- Operational SLA monitoring and escalation compliance (Section 49)
- Internal consistency validation completion before Phase 1 start (Section 55)
- Launch entitlement lifecycle (trial activation, expiry, paid activation, suspended fail-closed behavior)
- Autonomous onboarding activation (role-specific checklist persistence and first-value completion path)
- Tenant CRM contact lifecycle (status transitions validated server-side with tenant-scoped auditability)
- Account creation conversion UX (minimum-identity signup, value reinforcement, commercial clarity, progressive profiling without blocking first value)

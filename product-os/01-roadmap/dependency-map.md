# Dependency Map

## Source of truth

- `MVP_PRD.md`
- `BUILD_READINESS_ARTIFACTS.md`

## Key dependencies

- FEAT-001 is foundational for all protected flows.
- FEAT-002 -> FEAT-003 -> FEAT-004 -> FEAT-005 -> FEAT-006 core chain.
- FEAT-007 depends on FEAT-001 and issue lifecycle consistency.
- FEAT-008 depends on stable event outputs from FEAT-004/5/6.
- FEAT-009 depends on stable API/events and tenant auth boundaries.
- FEAT-010 depends on permission/state/approval models.

## Sequencing assumptions

- No filing release without idempotent submission and audit trail.
- No sponsor-level operations without tenant isolation verification.
- No milestone signoff without acceptance + exception + event coverage.

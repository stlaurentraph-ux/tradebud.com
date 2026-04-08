# QA Scenarios

## Canonical source

- `BUILD_READINESS_ARTIFACTS.md` (QA scenarios)

## Mandatory E2E scenarios

1. Offline capture -> sync -> verify -> shipment -> accepted filing
2. Pre-flight failure -> remediation -> re-validation -> filing
3. High risk -> evidence request -> authorized override -> audit trace
4. Sponsor oversight intervention without cross-tenant violation
5. Submission timeout -> idempotent retry -> no duplicate filing
6. Self-intersecting polygon upload -> `ST_MakeValid` correction -> accepted only if area variance <= 5%
7. Corrupted client HLC -> server fallback ordering -> deterministic conflict resolution
8. Large shipment (size/vertex overflow) -> payload chunking -> multi-reference reconciliation
9. Deep aggregation chain -> materialized lineage lookup -> no recursive runtime timeout
10. GDPR erasure request on submitted producer -> cryptographic shredding -> audit references preserved
11. Polygon normalization guard -> `ST_MakeValid` applies -> rejected when correction variance exceeds 5%
12. PostGIS integration lane -> geography area query and invalid-polygon normalization checks run under `TEST_DATABASE_URL`

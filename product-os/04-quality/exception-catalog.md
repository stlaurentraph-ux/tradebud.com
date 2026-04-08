# Exception Catalog

## Canonical source

- `BUILD_READINESS_ARTIFACTS.md` (Error catalog)

## Rule

Use the canonical codes and meanings. Do not rename codes in implementation docs.

## Categories

- Geospatial: GEO-001, GEO-002
- Mobile sync: MOB-001, MOB-002
- Evidence/validation: DOC-001, DOC-002, VAL-001, VAL-002
- Risk/workflow: RISK-001, RISK-002, WF-001
- Collaboration: CHAT-001
- Filing: FIL-001, FIL-002, FIL-003
- Auth/tenant: AUTH-001, TEN-001
- Geospatial validity/precision: GEO-101 (INVALID_GEOMETRY_AUTOFIX_FAILED), GEO-102 (GEOMETRY_AREA_VARIANCE_EXCEEDED)
- HLC sync integrity: MOB-101 (HLC_TIMESTAMP_INVALID), MOB-102 (HLC_ORDER_CONFLICT_UNRESOLVED)
- Lineage materialization: LIN-101 (ROOT_PLOT_IDS_MATERIALIZATION_FAILED)
- TRACES payload limits: FIL-101 (DDS_PAYLOAD_SIZE_LIMIT_EXCEEDED), FIL-102 (DDS_VERTEX_LIMIT_EXCEEDED)
- GDPR shredding: GDPR-101 (ERASURE_REQUEST_RETENTION_CONSTRAINT), GDPR-102 (ANONYMIZATION_PIPELINE_FAILED)

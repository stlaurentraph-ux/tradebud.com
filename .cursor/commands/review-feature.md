# review-feature

Check acceptance criteria, permissions, states, errors, analytics, and canonical consistency.

## Mandatory read-order

1. `TRACEBUD_V1_2_EUDR_SPEC.md`
2. `REQUIREMENTS.md`
3. `MVP_PRD.md`
4. `PRODUCT_PRD.md`
5. `JTBD_PRD.md`
6. `BUILD_READINESS_ARTIFACTS.md`

## Review checklist (GO only if all pass)

- Permissions are explicit, least-privilege, and role-scoped.
- State transitions follow canonical workflow definitions.
- Exception handling includes recovery path, owner, and user-visible resolution.
- Analytics events map to acceptance criteria and operational monitoring needs.
- Data model and API behavior match canonical names for roles, states, and events.

### v1.6 enterprise checks (when relevant)

- Spatial correctness: no compliance-critical area math on `GEOMETRY`.
- Polygon validity: `ST_MakeValid` path and >5% area-variance rejection behavior are covered.
- Lineage performance: O(1) runtime traversal preserved with materialized lineage data.
- Offline sync: HLC conflict ordering and idempotency behavior are validated.
- TRACES integration: payload chunking strategy and multi-reference linkage are validated.
- GDPR: cryptographic shredding path preserves retention and audit requirements.

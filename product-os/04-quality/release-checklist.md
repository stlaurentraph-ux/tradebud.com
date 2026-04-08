# Release Checklist

## Canonical sources

- `BUILD_READINESS_ARTIFACTS.md`
- `MVP_PRD.md`

## Gates

- [ ] Scope stays within v1 boundary
- [ ] Permissions and tenant isolation verified
- [ ] Canonical state transitions enforced
- [ ] Exception handling and recovery paths verified
- [ ] Required events instrumented
- [ ] Acceptance criteria pass
- [ ] Docs and status logs updated
- [ ] Security and audit controls validated
- [ ] Spatial controls validated (`GEOGRAPHY`, `ST_MakeValid`, area variance guard)
- [ ] Offline conflict controls validated (HLC ordering and idempotent replay)
- [ ] Runtime lineage performance validated (materialized O(1) traversal path)
- [ ] TRACES large-payload controls validated (chunking and reference reconciliation)
- [ ] GDPR shredding flow validated (PII removal with retention-safe audit continuity)
- [ ] CI integration gate passes with `TEST_DATABASE_URL` and `npm run test:integration`

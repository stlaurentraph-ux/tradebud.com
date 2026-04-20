# Remaining Lanes Final Execution Pack (Closeout to 100)

Date: 2026-04-20  
Owner: Product + Engineering + Infra (privileged DB operator)

## Purpose

One-pass operator packet to close the remaining non-code scorecard lanes:

1) `TB-V16-003` staging migration lane (`GEOGRAPHY`)  
2) `public.spatial_ref_sys` privileged owner remediation lane  
3) Cooperative inbox backend-only operational closeout confirmation lane

## Preconditions (all required)

- [ ] Staging DB window approved (read/write freeze acceptable during migration).
- [ ] Privileged DB operator available for owner-level extension/table actions.
- [ ] Backup/snapshot completed before any SQL run.
- [ ] Current branch includes latest CI and OpenAPI lane completion evidence.

## Execution Order (strict)

1. Run staging `GEOGRAPHY` migration (`tb_v16_003_geography_migration.sql`).
2. Capture migration parity/guardrail evidence.
3. Run owner remediation runbook (`tb_v16_009_postgis_owner_remediation_runbook.sql`) in privileged window.
4. Capture advisor/security evidence after remediation.
5. Run cooperative inbox backend-only fail-closed verification checklist.
6. Publish status updates (`remaining-execution-scorecard`, `current-focus`, `daily-log`, `done-log` as applicable).

---

## A) TB-V16-003 staging execution

SQL source: `tracebud-backend/sql/tb_v16_003_geography_migration.sql`

### A1. Apply migration

```sql
-- Execute in staging DB
\i tracebud-backend/sql/tb_v16_003_geography_migration.sql
```

### A2. Post-apply verification queries

```sql
-- Column presence
select table_name, column_name, udt_name
from information_schema.columns
where table_name in ('plot', 'plot_geometry_version')
  and column_name = 'geography'
order by table_name;

-- Backfill completeness
select
  sum(case when geometry is not null and geography is null then 1 else 0 end) as plot_missing_geography
from plot;

select
  sum(case when geometry is not null and geography is null then 1 else 0 end) as plot_version_missing_geography
from plot_geometry_version;

-- Index presence
select indexname, indexdef
from pg_indexes
where indexname in ('idx_plot_geography_gist', 'idx_plot_geometry_version_geography_gist');
```

### A3. Area parity sampling query (guardrail evidence)

```sql
-- Sample parity check: geography-derived area vs persisted area_ha
select
  id,
  area_ha as persisted_area_ha,
  round((st_area(geography) / 10000.0)::numeric, 4) as computed_area_ha,
  round(abs(area_ha - round((st_area(geography) / 10000.0)::numeric, 4))::numeric, 4) as abs_delta_ha
from plot
where geography is not null
order by random()
limit 20;
```

### A4. Go / no-go for A

- Go if:
  - `geography` columns exist on both tables.
  - Missing-geography counts are `0` for rows with non-null legacy geometry.
  - Both GIST indexes exist.
  - Sample parity deltas are within expected tolerance.
- No-go if any check fails; pause before B.

### A5. Rollback criteria (A)

- If migration transaction fails: stop and collect DB error.
- If post-checks fail materially: do not proceed to owner remediation.
- Preserve additive rollback safety by keeping legacy geometry columns untouched (as designed).

---

## B) Privileged owner remediation (`spatial_ref_sys`)

SQL sources:
- `tracebud-backend/sql/tb_v16_009_postgis_owner_remediation_runbook.sql`
- `tracebud-backend/sql/tb_v16_009_postgis_owner_remediation_verify.sql`

### B1. Apply runbook (owner/superuser only)

```sql
-- Execute in privileged window
\i tracebud-backend/sql/tb_v16_009_postgis_owner_remediation_runbook.sql
```

### B2. Post-run verification (deterministic)

```sql
-- Preferred: emits PASS/FAIL summary + detailed snapshots
\i tracebud-backend/sql/tb_v16_009_postgis_owner_remediation_verify.sql
```

### B3. Fallback manual verification queries (if needed)

```sql
select extname, extnamespace::regnamespace as schema
from pg_extension
where extname = 'postgis';

select n.nspname as schema, c.relname, c.relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relname = 'spatial_ref_sys'
  and c.relkind = 'r';

select schemaname, policyname, cmd, roles, qual
from pg_policies
where tablename = 'spatial_ref_sys';

select grantee, privilege_type
from information_schema.role_table_grants
where table_name = 'spatial_ref_sys'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;
```

### B4. Go / no-go for B

- Go if:
  - verification script returns `remediation_status = PASS`
  - RLS is enabled on `spatial_ref_sys`.
  - Read policy exists and broad client DML grants are removed.
  - PostGIS extension/schema and table placement are consistent with platform constraints.
- No-go if privileged actions partially apply or advisor/security posture remains regressed.

### B5. Rollback criteria (B)

- Do not force manual extension moves if platform rejects schema changes.
- If policy/grant state is inconsistent, pause and restore prior known-good grants/policies before reopening client traffic.

---

## C) Cooperative inbox backend-only closeout

### C1. Verification checklist

- [ ] Confirm list/respond/bootstrap routes have no local-success fallback branch in backend-unavailable state.
- [ ] Confirm fail-closed behavior for `401/403/5xx` still passes through route + page flows.
- [ ] Confirm deny/allow role-path scenarios for deferred routes remain covered in tests.

### C2. Required command checks

```bash
# dashboard route/page verification slice
npm test --workspace apps/dashboard-product

# backend ownership/integration guard (already required lane)
npm run test:integration:ownership --prefix tracebud-backend
```

### C3. Go / no-go for C

- Go if fail-closed behavior and deny/allow coverage remain stable after latest changes.
- No-go if any deferred-route or pass-through semantics regress.

---

## Evidence capture template (fill once)

- Window date/time:
- Operator:
- Environment:
- TB-V16-003 apply result:
- TB-V16-003 verification result:
- `spatial_ref_sys` remediation apply result:
- Advisor/security post-check result:
- Cooperative inbox fail-closed verification result:
- Final go/no-go:

## Status update targets after execution

Update all:

- `product-os/06-status/remaining-execution-scorecard.md`
- `product-os/06-status/current-focus.md`
- `product-os/06-status/daily-log.md`
- `product-os/06-status/done-log.md` (if lanes close to done-state)


-- TB-V16-009 verification: PostGIS owner remediation
-- Run after tb_v16_009_postgis_owner_remediation_runbook.sql

WITH extension_state AS (
  SELECT extname, extnamespace::regnamespace::text AS extension_schema
  FROM pg_extension
  WHERE extname = 'postgis'
),
spatial_ref_state AS (
  SELECT n.nspname AS table_schema, c.relname, c.relrowsecurity
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = 'spatial_ref_sys'
    AND c.relkind = 'r'
    AND n.nspname IN ('public', 'extensions')
  ORDER BY CASE n.nspname WHEN 'extensions' THEN 0 ELSE 1 END
  LIMIT 1
),
grant_state AS (
  SELECT grantee, privilege_type
  FROM information_schema.role_table_grants
  WHERE table_name = 'spatial_ref_sys'
    AND grantee IN ('anon', 'authenticated')
),
policy_state AS (
  SELECT schemaname, policyname, cmd, roles, qual
  FROM pg_policies
  WHERE tablename = 'spatial_ref_sys'
)
SELECT
  CASE
    WHEN (SELECT extension_schema FROM extension_state) = 'extensions'
      THEN 'pass'
    ELSE 'warn'
  END AS postgis_extension_schema_status,
  COALESCE((SELECT extension_schema FROM extension_state), 'missing') AS postgis_extension_schema,
  CASE
    WHEN COALESCE((SELECT relrowsecurity FROM spatial_ref_state), false) THEN 'pass'
    ELSE 'fail'
  END AS spatial_ref_sys_rls_status,
  COALESCE((SELECT table_schema FROM spatial_ref_state), 'missing') AS spatial_ref_sys_schema,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM grant_state
      WHERE privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
    ) THEN 'fail'
    ELSE 'pass'
  END AS spatial_ref_sys_dml_grants_status,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM policy_state WHERE policyname = 'spatial_ref_sys_public_read' AND cmd = 'SELECT'
    ) THEN 'pass'
    ELSE 'fail'
  END AS spatial_ref_sys_select_policy_status;

-- Supporting snapshots for evidence capture:
SELECT extname, extnamespace::regnamespace AS schema
FROM pg_extension
WHERE extname = 'postgis';

SELECT n.nspname AS schema, c.relname, c.relrowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'spatial_ref_sys'
  AND c.relkind = 'r';

SELECT schemaname, policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'spatial_ref_sys';

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'spatial_ref_sys'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;
-- TB-V16-009: PostGIS owner remediation verification checks
-- Purpose: provide deterministic post-run evidence after
-- `tb_v16_009_postgis_owner_remediation_runbook.sql` execution.
--
-- Expected result:
-- - Emits a single-row PASS/FAIL summary with details.
-- - Prints supporting state snapshots for extension schema, table RLS,
--   policies, and anon/authenticated grants.

-- 1) Supporting snapshots
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

-- 2) Deterministic PASS/FAIL summary
with spatial_ref_sys_table as (
  select n.nspname as schema_name, c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relname = 'spatial_ref_sys'
    and c.relkind = 'r'
  order by case n.nspname when 'extensions' then 0 else 1 end
  limit 1
),
read_policy as (
  select exists (
    select 1
    from pg_policies p
    where p.tablename = 'spatial_ref_sys'
      and p.policyname = 'spatial_ref_sys_public_read'
      and p.cmd = 'SELECT'
  ) as present
),
broad_dml_grants as (
  select count(*)::int as grant_count
  from information_schema.role_table_grants g
  where g.table_name = 'spatial_ref_sys'
    and g.grantee in ('anon', 'authenticated')
    and g.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
),
checks as (
  select
    s.schema_name,
    s.relrowsecurity as rls_enabled,
    rp.present as read_policy_present,
    (bdg.grant_count = 0) as broad_dml_removed,
    bdg.grant_count as broad_dml_grant_count
  from spatial_ref_sys_table s
  cross join read_policy rp
  cross join broad_dml_grants bdg
)
select
  case
    when rls_enabled and read_policy_present and broad_dml_removed then 'PASS'
    else 'FAIL'
  end as remediation_status,
  schema_name as spatial_ref_sys_schema,
  rls_enabled,
  read_policy_present,
  broad_dml_removed,
  broad_dml_grant_count
from checks;

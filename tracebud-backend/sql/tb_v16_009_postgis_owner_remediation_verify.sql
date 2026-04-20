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

-- TB-V16-009: PostGIS owner remediation runbook (owner-executed)
-- Purpose: clear remaining Supabase advisor security findings tied to extension ownership:
--   - rls_disabled_in_public on public.spatial_ref_sys
--   - extension_in_public for postgis
--   - overly broad anon/authenticated grants on spatial_ref_sys
--
-- IMPORTANT:
-- - This script is intended for execution by a database owner/superuser in a controlled window.
-- - Do not run through limited app migration roles if they do not own extension objects.
-- - Validate in staging first.

BEGIN;

-- 1) Ensure dedicated extensions schema exists.
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2) Move postgis extension out of public schema.
-- NOTE: This requires owner privileges over the extension.
DO $$
BEGIN
  ALTER EXTENSION postgis SET SCHEMA extensions;
EXCEPTION
  WHEN feature_not_supported THEN
    RAISE NOTICE 'postgis SET SCHEMA is not supported on this platform/version; continue with table-level hardening.';
END $$;

-- 3) Harden spatial_ref_sys access regardless of final schema path.
-- NOTE: Depending on extension behavior/version, spatial_ref_sys may remain in public
--       or move into extensions. This block handles both cases.
DO $$
DECLARE
  target_schema text;
BEGIN
  SELECT n.nspname
    INTO target_schema
  FROM pg_class c
  JOIN pg_namespace n
    ON n.oid = c.relnamespace
  WHERE c.relname = 'spatial_ref_sys'
    AND c.relkind = 'r'
    AND n.nspname IN ('public', 'extensions')
  ORDER BY CASE n.nspname WHEN 'extensions' THEN 0 ELSE 1 END
  LIMIT 1;

  IF target_schema IS NULL THEN
    RAISE EXCEPTION 'spatial_ref_sys table not found in public/extensions.';
  END IF;

  EXECUTE format('ALTER TABLE %I.spatial_ref_sys ENABLE ROW LEVEL SECURITY;', target_schema);

  -- Remove broad DML exposure from client-facing roles.
  EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE %I.spatial_ref_sys FROM anon, authenticated;', target_schema);

  -- Keep read compatibility under explicit policy.
  EXECUTE format('DROP POLICY IF EXISTS spatial_ref_sys_public_read ON %I.spatial_ref_sys;', target_schema);
  EXECUTE format('CREATE POLICY spatial_ref_sys_public_read ON %I.spatial_ref_sys FOR SELECT TO public USING (true);', target_schema);
END $$;

COMMIT;

-- 4) Post-run verification queries (run separately):
-- Preferred: run `tb_v16_009_postgis_owner_remediation_verify.sql` for
-- deterministic PASS/FAIL summary + supporting snapshots.
-- select extname, extnamespace::regnamespace as schema from pg_extension where extname = 'postgis';
-- select n.nspname as schema, c.relname, c.relrowsecurity
-- from pg_class c join pg_namespace n on n.oid = c.relnamespace
-- where c.relname = 'spatial_ref_sys' and c.relkind = 'r';
-- select schemaname, policyname, cmd, roles, qual
-- from pg_policies
-- where tablename='spatial_ref_sys';
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_name='spatial_ref_sys'
--   and grantee in ('anon', 'authenticated')
-- order by grantee, privilege_type;

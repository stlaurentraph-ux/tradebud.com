-- TB-V16-031: PostGIS robust relocation (Supabase documented owner path)
-- https://supabase.com/docs/guides/database/extensions/postgis#troubleshooting
--
-- Prerequisites:
-- 1) Take a logical backup (Dashboard backup or pg_dump) before running.
-- 2) Run yourself as Supabase **project owner** in Dashboard → SQL Editor (single transaction).
--    Supabase Support cannot run this robust path for you; their optional fallback is a separate
--    support-run relocation snippet (not this full extrelocatable flow).
-- 3) Use a direct DB session (Settings → Database → connection string, session mode on port 5432).
--    MCP/migration APIs often use a restricted role and fail with:
--      - permission denied for table pg_extension (extowner is usually supabase_admin)
--      - must be owner of table spatial_ref_sys
--
-- Current project baseline (2026-06): postgis 3.3.7 in schema public.
-- Do NOT DROP EXTENSION postgis CASCADE — plot/sinaph_zone/indigenous_zone use geometry/geography.
--
-- STOP if SQL Editor returns:
--   ERROR: 42501: permission denied for table pg_extension
-- On hosted Supabase, `postgis` is owned by `supabase_admin`; project `postgres` cannot run
-- UPDATE pg_extension. The robust flow is documented for self-serve but blocked on this role.
-- Next step: ask Supabase Support to run their **simplified relocation snippet** (Clément's option B).

-- ---------------------------------------------------------------------------
-- Preflight (read-only; safe to run first)
-- ---------------------------------------------------------------------------
-- select extname, extversion, extnamespace::regnamespace as schema
-- from pg_extension where extname like 'postgis%';
--
-- select n.nspname, c.relname, a.attname, format_type(a.atttypid, a.atttypmod) as type
-- from pg_attribute a
-- join pg_class c on c.oid = a.attrelid
-- join pg_namespace n on n.oid = c.relnamespace
-- join pg_type t on t.oid = a.atttypid
-- where t.typname in ('geometry', 'geography')
--   and n.nspname = 'public'
--   and a.attnum > 0 and not a.attisdropped
-- order by 1, 2, 3;

CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

BEGIN;

-- Official relocatable workaround (PostGIS 2.3+ / non-relocatable by default).
UPDATE pg_extension
  SET extrelocatable = true
WHERE extname = 'postgis';

ALTER EXTENSION postgis SET SCHEMA extensions;

-- For PostGIS < 3.5 use the platform "next" transition target (Supabase support snippet).
-- For PostGIS >= 3.5 you may use UPDATE TO 'ANY' instead of 'next'.
ALTER EXTENSION postgis UPDATE TO 'next';
ALTER EXTENSION postgis UPDATE;

UPDATE pg_extension
  SET extrelocatable = false
WHERE extname = 'postgis';

COMMIT;

-- ---------------------------------------------------------------------------
-- Post-relocation hardening (spatial_ref_sys should live under extensions)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  target_schema text;
BEGIN
  SELECT n.nspname
    INTO target_schema
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = 'spatial_ref_sys'
    AND c.relkind = 'r'
    AND n.nspname IN ('public', 'extensions')
  ORDER BY CASE n.nspname WHEN 'extensions' THEN 0 ELSE 1 END
  LIMIT 1;

  IF target_schema IS NULL THEN
    RAISE EXCEPTION 'spatial_ref_sys not found after relocation.';
  END IF;

  EXECUTE format('ALTER TABLE %I.spatial_ref_sys ENABLE ROW LEVEL SECURITY;', target_schema);
  EXECUTE format(
    'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE %I.spatial_ref_sys FROM anon, authenticated;',
    target_schema,
  );
  EXECUTE format('DROP POLICY IF EXISTS spatial_ref_sys_public_read ON %I.spatial_ref_sys;', target_schema);
  EXECUTE format(
    'CREATE POLICY spatial_ref_sys_public_read ON %I.spatial_ref_sys FOR SELECT TO public USING (true);',
    target_schema,
  );
END $$;

-- ---------------------------------------------------------------------------
-- Smoke tests (run after commit)
-- ---------------------------------------------------------------------------
-- select extname, extversion, extnamespace::regnamespace as schema from pg_extension where extname = 'postgis';
-- select count(*) from public.plot where centroid is not null;
-- select extensions.st_area(centroid::extensions.geography) from public.plot where centroid is not null limit 1;

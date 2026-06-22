-- PostGIS is installed in the `extensions` schema on Supabase; include it in search_path
-- so geography/geometry helpers resolve without schema-qualified names.
ALTER DATABASE postgres SET search_path TO public, extensions;
ALTER ROLE postgres SET search_path TO public, extensions;

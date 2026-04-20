-- TB-V16-003: GEOGRAPHY migration and backfill scaffold
-- Purpose:
-- 1) Introduce geography columns for spheroidal-accurate area and distance logic.
-- 2) Backfill from existing geometry columns.
-- 3) Add non-destructive indexes and validation checks.
--
-- NOTE:
-- - Review and adapt in staging before production rollout.
-- - This script is intentionally additive (no destructive drops).

BEGIN;

-- Ensure PostGIS is available.
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1) Add GEOGRAPHY columns (additive, safe to rerun).
ALTER TABLE IF EXISTS plot
  ADD COLUMN IF NOT EXISTS geography geography(Geometry, 4326);

ALTER TABLE IF EXISTS plot_geometry_version
  ADD COLUMN IF NOT EXISTS geography geography(Geometry, 4326);

-- 2) Backfill geography from legacy geometry where possible.
UPDATE plot
SET geography = geometry::geography
WHERE geography IS NULL
  AND geometry IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plot_geometry_version') THEN
    EXECUTE $q$
      UPDATE plot_geometry_version
      SET geography = geometry::geography
      WHERE geography IS NULL
        AND geometry IS NOT NULL
    $q$;
  END IF;
END $$;

-- 3) Recompute canonical area_ha from geography for consistency.
UPDATE plot
SET area_ha = ROUND((ST_Area(geography) / 10000.0)::numeric, 4)
WHERE geography IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plot_geometry_version') THEN
    EXECUTE $q$
      UPDATE plot_geometry_version
      SET area_ha = ROUND((ST_Area(geography) / 10000.0)::numeric, 4)
      WHERE geography IS NOT NULL
    $q$;
  END IF;
END $$;

-- 4) Add spatial indexes for geography queries.
CREATE INDEX IF NOT EXISTS idx_plot_geography_gist
  ON plot USING GIST (geography);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plot_geometry_version') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_plot_geometry_version_geography_gist ON plot_geometry_version USING GIST (geography)';
  END IF;
END $$;

-- 5) Guardrail check constraints (non-blocking if table missing).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plot') THEN
    BEGIN
      ALTER TABLE plot
        ADD CONSTRAINT plot_geography_present_check
        CHECK (
          (kind = 'point' AND geography IS NOT NULL)
          OR (kind = 'polygon' AND geography IS NOT NULL)
        ) NOT VALID;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

COMMIT;

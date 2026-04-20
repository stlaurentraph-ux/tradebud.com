-- TB-V16-011: Yield benchmark governance baseline
-- Purpose:
-- - Add canonical yield benchmark table for source-traceable benchmark ingestion.
-- - Enforce dual-control-friendly activation shape and source-reference quality checks.

BEGIN;

CREATE TABLE IF NOT EXISTS yield_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity TEXT NOT NULL,
  geography TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('SPONSOR_OVERRIDE', 'NATIONAL_STATS', 'USDA_FAS', 'FAOSTAT')),
  source_reference TEXT NOT NULL,
  yield_lower_kg_ha NUMERIC(12,2) NOT NULL,
  yield_upper_kg_ha NUMERIC(12,2) NOT NULL,
  seasonality_factor NUMERIC(8,4) NOT NULL DEFAULT 1.0000,
  review_cadence TEXT NOT NULL DEFAULT 'annual',
  active BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id UUID NULL,
  approved_by_user_id UUID NULL,
  approved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT yield_benchmarks_bounds_check CHECK (yield_lower_kg_ha <= yield_upper_kg_ha),
  CONSTRAINT yield_benchmarks_activation_check CHECK (
    active = FALSE
    OR (approved_by_user_id IS NOT NULL AND approved_at IS NOT NULL)
  ),
  CONSTRAINT yield_benchmarks_source_reference_check CHECK (
    source_type = 'SPONSOR_OVERRIDE'
    OR source_reference ~* '^(https?://\\S+|doi:|isbn:|issn:|report:|publication:)'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_yield_benchmarks_active_unique
  ON yield_benchmarks (commodity, geography, source_type)
  WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_yield_benchmarks_active_updated
  ON yield_benchmarks (active, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_yield_benchmarks_commodity_geo
  ON yield_benchmarks (commodity, geography);

COMMIT;

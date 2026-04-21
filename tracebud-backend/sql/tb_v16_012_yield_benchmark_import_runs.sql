-- TB-V16-012: Yield benchmark import run persistence
-- Purpose:
-- - Persist auditable import run metadata for source sync/replay diagnostics.
-- - Provide deterministic run status tracking for benchmark ingestion operations.

BEGIN;

CREATE TABLE IF NOT EXISTS yield_benchmark_import_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('USDA_FAS', 'FAOSTAT')),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  actor_user_id UUID NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yield_benchmark_import_runs_started_at
  ON yield_benchmark_import_runs (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_yield_benchmark_import_runs_status
  ON yield_benchmark_import_runs (status, started_at DESC);

COMMIT;

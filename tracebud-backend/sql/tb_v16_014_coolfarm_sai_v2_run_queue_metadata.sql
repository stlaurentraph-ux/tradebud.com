-- TB-V16-014: Cool Farm + SAI V2 run queue metadata
-- Purpose:
-- - Add queue/worker-ready metadata fields for shadow run orchestration.
-- - Preserve additive, backwards-compatible schema evolution.

BEGIN;

ALTER TABLE integration_runs_v2
  ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count >= 0),
  ADD COLUMN IF NOT EXISTS error_code TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_integration_runs_v2_tenant_status_started
  ON integration_runs_v2 (tenant_id, status, started_at DESC);

COMMIT;

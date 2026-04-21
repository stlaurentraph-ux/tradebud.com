-- TB-V16-015: Cool Farm + SAI V2 retry backoff metadata
-- Purpose:
-- - Add retry scheduling metadata and guardrail support for run retries.
-- - Keep schema evolution additive and backwards-compatible.

BEGIN;

ALTER TABLE integration_runs_v2
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_integration_runs_v2_tenant_next_retry
  ON integration_runs_v2 (tenant_id, next_retry_at);

COMMIT;

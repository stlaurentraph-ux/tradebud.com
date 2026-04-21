-- TB-V16-016: Cool Farm + SAI V2 run claim lock metadata
-- Purpose:
-- - Add run claim fields to prevent duplicate worker processing.
-- - Keep migration additive and backward-compatible.

BEGIN;

ALTER TABLE integration_runs_v2
  ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID NULL,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_integration_runs_v2_tenant_claimed
  ON integration_runs_v2 (tenant_id, claimed_at);

COMMIT;

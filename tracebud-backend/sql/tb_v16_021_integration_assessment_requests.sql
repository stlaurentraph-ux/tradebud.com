-- TB-V16-021: Assessment request workflow persistence (dashboard -> farmer app)
-- Purpose:
-- - Persist tenant-scoped SAI + Cool Farm assessment requests.
-- - Support assignment, farmer execution lifecycle, and dashboard review transitions.

BEGIN;

CREATE TABLE IF NOT EXISTS integration_assessment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  pathway TEXT NOT NULL CHECK (pathway IN ('annuals', 'rice')),
  farmer_user_id UUID NOT NULL,
  requested_by_user_id UUID NULL,
  status TEXT NOT NULL CHECK (
    status IN ('sent', 'opened', 'in_progress', 'submitted', 'reviewed', 'needs_changes', 'cancelled')
  ),
  title TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  due_at TIMESTAMPTZ NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_assessment_requests_tenant_status
  ON integration_assessment_requests (tenant_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_assessment_requests_farmer
  ON integration_assessment_requests (tenant_id, farmer_user_id, updated_at DESC);

COMMIT;

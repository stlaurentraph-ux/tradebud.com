-- TB-V16-013: Cool Farm + SAI V2 questionnaire persistence (shadow lane)
-- Purpose:
-- - Add isolated V2 persistence surfaces without impacting V1 runtime entities.
-- - Persist questionnaire drafts/runs/evidence/audit with tenant-scoped access patterns.

BEGIN;

CREATE TABLE IF NOT EXISTS integration_questionnaire_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  farm_id UUID NULL,
  pathway TEXT NOT NULL CHECK (pathway IN ('annuals', 'rice')),
  schema_id TEXT NOT NULL DEFAULT 'farmQuestionnaireV1',
  schema_version TEXT NOT NULL DEFAULT '0.1.0-draft',
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'validated', 'scored', 'reviewed')),
  idempotency_key TEXT NOT NULL,
  response JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id UUID NULL,
  updated_by_user_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_integration_questionnaire_v2_tenant_status
  ON integration_questionnaire_v2 (tenant_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_questionnaire_v2_tenant_pathway
  ON integration_questionnaire_v2 (tenant_id, pathway, updated_at DESC);

CREATE TABLE IF NOT EXISTS integration_runs_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  questionnaire_id UUID NOT NULL REFERENCES integration_questionnaire_v2(id) ON DELETE CASCADE,
  run_type TEXT NOT NULL CHECK (run_type IN ('validation', 'scoring', 'review')),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_runs_v2_tenant_questionnaire
  ON integration_runs_v2 (tenant_id, questionnaire_id, started_at DESC);

CREATE TABLE IF NOT EXISTS integration_evidence_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  questionnaire_id UUID NOT NULL REFERENCES integration_questionnaire_v2(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  field_id TEXT NOT NULL,
  document_ref TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_evidence_v2_tenant_questionnaire
  ON integration_evidence_v2 (tenant_id, questionnaire_id, created_at DESC);

CREATE TABLE IF NOT EXISTS integration_audit_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  questionnaire_id UUID NULL REFERENCES integration_questionnaire_v2(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_audit_v2_tenant_created
  ON integration_audit_v2 (tenant_id, created_at DESC);

COMMIT;

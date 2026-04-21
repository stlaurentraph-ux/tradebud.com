-- TB-V16-022: Link assessment requests to questionnaire drafts for submission gating

BEGIN;

ALTER TABLE integration_assessment_requests
  ADD COLUMN IF NOT EXISTS questionnaire_id UUID NULL
    REFERENCES integration_questionnaire_v2(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_integration_assessment_requests_tenant_questionnaire
  ON integration_assessment_requests (tenant_id, questionnaire_id);

COMMIT;

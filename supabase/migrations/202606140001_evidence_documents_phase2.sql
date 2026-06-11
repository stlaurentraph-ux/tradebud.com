-- Phase 2: evidence_documents + provenance + compliance_issues (tenure parse)
-- Mirrors tracebud-backend/sql/tb_v16_043_evidence_documents_phase2.sql

CREATE TABLE IF NOT EXISTS evidence_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NULL,
  plot_id UUID NOT NULL,
  evidence_kind TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (
    document_type IN (
      'LAND_TITLE',
      'REGISTRATION_CERT',
      'HARVEST_RECORD',
      'CONSENT_FORM',
      'PHOTO',
      'SATELLITE_REPORT',
      'AUDIT_CERTIFICATE',
      'IMPORT_PERMIT',
      'OTHER'
    )
  ),
  file_storage_key TEXT NOT NULL,
  file_hash_sha256 TEXT NULL,
  file_size_bytes BIGINT NULL,
  mime_type TEXT NULL,
  source_channel TEXT NOT NULL DEFAULT 'MOBILE_UPLOAD',
  source_uploaded_by UUID NULL,
  parse_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    parse_status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'MANUAL_REQUIRED')
  ),
  parse_result JSONB NULL,
  parse_confidence NUMERIC(3, 2) NULL,
  parse_reviewed_by UUID NULL,
  parse_reviewed_at TIMESTAMPTZ NULL,
  retention_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 years'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (plot_id, file_storage_key)
);

CREATE INDEX IF NOT EXISTS idx_evidence_documents_plot
  ON evidence_documents (plot_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_documents_parse_queue
  ON evidence_documents (parse_status, created_at ASC)
  WHERE parse_status IN ('MANUAL_REQUIRED', 'FAILED');

CREATE TABLE IF NOT EXISTS document_provenance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_document_id UUID NOT NULL REFERENCES evidence_documents (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'SYSTEM',
  actor_id UUID NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_provenance_events_doc
  ON document_provenance_events (evidence_document_id, created_at DESC);

CREATE TABLE IF NOT EXISTS compliance_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NULL,
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'BLOCKING')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'in_progress', 'resolved', 'closed')
  ),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  linked_entity_type TEXT NOT NULL,
  linked_entity_id TEXT NOT NULL,
  resolution_path TEXT NULL,
  due_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_issues_tenant_status
  ON compliance_issues (tenant_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_issues_open_tenure_verification
  ON compliance_issues (linked_entity_id)
  WHERE linked_entity_type = 'tenure_verification' AND status = 'open';

ALTER TABLE plot_tenure_verification
  ADD COLUMN IF NOT EXISTS evidence_document_id UUID NULL REFERENCES evidence_documents (id);

CREATE INDEX IF NOT EXISTS idx_plot_tenure_verification_review_queue
  ON plot_tenure_verification (parse_status, updated_at DESC)
  WHERE parse_status IN ('MANUAL_REQUIRED', 'FAILED');

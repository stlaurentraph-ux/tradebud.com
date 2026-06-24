-- Mirror: tracebud-backend/sql/tb_v16_064_bulk_import_jobs.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.bulk_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  import_type TEXT NOT NULL CHECK (import_type IN ('PRODUCERS', 'PLOTS', 'EVIDENCE_METADATA')),
  file_storage_key TEXT NULL,
  file_hash_sha256 TEXT NOT NULL,
  payload_jsonb JSONB NOT NULL,
  total_records INTEGER NOT NULL CHECK (total_records > 0),
  processed_records INTEGER NOT NULL DEFAULT 0 CHECK (processed_records >= 0),
  success_count INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  duplicate_skipped_count INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_skipped_count >= 0),
  status TEXT NOT NULL CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL')),
  error_summary JSONB NULL,
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  created_by_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bulk_import_jobs_tenant_created_at
  ON public.bulk_import_jobs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bulk_import_jobs_tenant_status
  ON public.bulk_import_jobs (tenant_id, status, updated_at DESC);

COMMIT;

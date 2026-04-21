-- TB-V16-019: Partner data export retry queue metadata
-- Purpose:
--   - Add retry/backoff metadata for failed partner exports.
--   - Support deterministic queue scanning and retry execution.

ALTER TABLE integration_partner_exports
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count >= 1),
  ADD COLUMN IF NOT EXISTS error_code TEXT NULL,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_partner_exports_retry_queue
  ON integration_partner_exports (tenant_id, status, next_retry_at ASC);


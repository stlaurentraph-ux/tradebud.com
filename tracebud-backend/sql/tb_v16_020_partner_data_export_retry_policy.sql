-- TB-V16-020: Partner data export retry policy metadata
-- Purpose:
--   - Add explicit retry cap tracking for failed partner exports.
--   - Support deterministic exhaustion handling and diagnostics.

ALTER TABLE integration_partner_exports
  ADD COLUMN IF NOT EXISTS retry_exhausted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_partner_exports_retry_exhausted
  ON integration_partner_exports (tenant_id, retry_exhausted_at DESC);


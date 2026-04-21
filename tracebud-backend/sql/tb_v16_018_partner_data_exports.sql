-- TB-V16-018: Partner data export persistence for idempotency and retrieval
-- Purpose:
--   - Provide tenant-safe idempotency ledger for partner export starts.
--   - Support export status and artifact retrieval endpoints.

CREATE TABLE IF NOT EXISTS integration_partner_exports (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('read:lineage', 'read:compliance', 'read:risk', 'read:shipments')),
  dataset TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('csv', 'parquet')),
  idempotency_key TEXT NOT NULL,
  cursor TEXT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'completed', 'failed')) DEFAULT 'queued',
  state TEXT NOT NULL
    CHECK (state IN ('partner_sync_pending', 'partner_sync_succeeded', 'partner_sync_terminal_failed'))
    DEFAULT 'partner_sync_pending',
  artifact_url TEXT NULL,
  created_by_user_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_partner_exports_tenant_status_created
  ON integration_partner_exports (tenant_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION set_integration_partner_exports_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_partner_exports_updated_at ON integration_partner_exports;
CREATE TRIGGER trg_partner_exports_updated_at
BEFORE UPDATE ON integration_partner_exports
FOR EACH ROW
EXECUTE FUNCTION set_integration_partner_exports_updated_at();


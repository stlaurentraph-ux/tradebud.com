-- TB-V16-025: request campaigns persistence
-- Purpose: persist tenant-scoped request campaigns server-side.

BEGIN;

CREATE TABLE IF NOT EXISTS request_campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  request_type TEXT NOT NULL CHECK (
    request_type IN (
      'MISSING_PRODUCER_PROFILE',
      'MISSING_PLOT_GEOMETRY',
      'MISSING_LAND_TITLE',
      'MISSING_HARVEST_RECORD',
      'YIELD_EVIDENCE',
      'CONSENT_GRANT',
      'DDS_REFERENCE',
      'GENERAL_EVIDENCE',
      'OTHER'
    )
  ),
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'EXPIRED', 'CANCELLED')),
  target_organization_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  target_farmer_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  target_plot_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  due_at TIMESTAMPTZ NOT NULL,
  reminder_sent_at TIMESTAMPTZ NULL,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  pending_count INTEGER NOT NULL DEFAULT 0,
  expired_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  idempotency_key TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_request_campaigns_tenant_idempotency
ON request_campaigns (tenant_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_request_campaigns_tenant_created
ON request_campaigns (tenant_id, created_at DESC);

COMMIT;


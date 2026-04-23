-- TB-V16-024: tenant CRM contacts persistence
-- Purpose: move contacts schema from runtime service initialization into migration-managed DDL.

BEGIN;

CREATE TABLE IF NOT EXISTS crm_contacts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NULL,
  organization TEXT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('exporter', 'cooperative', 'farmer', 'other')),
  status TEXT NOT NULL CHECK (status IN ('new', 'invited', 'engaged', 'submitted', 'inactive', 'blocked')),
  country TEXT NULL,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  consent_status TEXT NOT NULL CHECK (consent_status IN ('unknown', 'granted', 'revoked')) DEFAULT 'unknown',
  last_activity_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_tenant_status
ON crm_contacts (tenant_id, status, updated_at DESC);

COMMIT;


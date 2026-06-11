-- Producer consent grants (farmer data sovereignty v1)
-- Mirrors tracebud-backend/sql/tb_v16_033_consent_grants.sql

CREATE TABLE IF NOT EXISTS consent_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmer_profile(id) ON DELETE CASCADE,
  grantee_tenant_id TEXT NOT NULL,
  grantee_org_name TEXT NULL,
  requester_user_id UUID NULL,
  purpose_code TEXT NOT NULL CHECK (
    purpose_code IN (
      'COMPLIANCE_COLLECTION',
      'SHIPMENT_PREPARATION',
      'DDS_SUBMISSION',
      'DOWNSTREAM_REFERENCE_SHARING',
      'AUDIT_RESPONSE',
      'PORTABILITY_TRANSFER'
    )
  ) DEFAULT 'COMPLIANCE_COLLECTION',
  data_scope TEXT[] NOT NULL DEFAULT ARRAY['identity', 'plots', 'evidence']::TEXT[],
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'revoked', 'denied')) DEFAULT 'pending',
  consent_mechanism TEXT NULL CHECK (
    consent_mechanism IN ('DIGITAL', 'VERBAL_WITNESSED', 'WRITTEN', 'PROXY')
  ),
  granted_at TIMESTAMPTZ NULL,
  revoked_at TIMESTAMPTZ NULL,
  revocation_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_grants_farmer_status
  ON consent_grants (farmer_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_consent_grants_tenant_farmer
  ON consent_grants (grantee_tenant_id, farmer_id, status);

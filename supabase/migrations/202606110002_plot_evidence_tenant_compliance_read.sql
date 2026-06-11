-- Allow exporter / compliance roles to read farmer evidence when an active consent grant
-- includes `evidence` in data_scope. Storage paths use the farmer's auth.uid() as prefix.

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

-- Replace farmer-only SELECT with unified farmer + tenant-compliance SELECT.
DROP POLICY IF EXISTS plot_evidence_select_own ON storage.objects;
DROP POLICY IF EXISTS plot_evidence_select_tenant_compliance ON storage.objects;
CREATE POLICY plot_evidence_select
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'plot-evidence'
    AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      OR (
        COALESCE(
          auth.jwt() -> 'app_metadata' ->> 'role',
          auth.jwt() -> 'user_metadata' ->> 'role',
          ''
        ) IN ('exporter', 'compliance_manager', 'admin', 'agent')
        AND COALESCE(
          auth.jwt() -> 'app_metadata' ->> 'tenant_id',
          auth.jwt() -> 'user_metadata' ->> 'tenant_id',
          ''
        ) <> ''
        AND EXISTS (
          SELECT 1
          FROM farmer_profile fp
          JOIN consent_grants cg ON cg.farmer_id = fp.id
          WHERE fp.user_id::text = (storage.foldername(name))[1]
            AND cg.grantee_tenant_id = COALESCE(
              auth.jwt() -> 'app_metadata' ->> 'tenant_id',
              auth.jwt() -> 'user_metadata' ->> 'tenant_id'
            )
            AND cg.status = 'active'
            AND 'evidence' = ANY(cg.data_scope)
        )
      )
    )
  );

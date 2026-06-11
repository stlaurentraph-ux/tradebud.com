-- RLS for consent_grants (TB-V16-041)

ALTER TABLE consent_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consent_grants_farmer_select ON consent_grants;
DROP POLICY IF EXISTS consent_grants_farmer_update ON consent_grants;
DROP POLICY IF EXISTS consent_grants_tenant_select ON consent_grants;

CREATE POLICY consent_grants_farmer_select
ON consent_grants FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM farmer_profile fp
    WHERE fp.id = consent_grants.farmer_id AND fp.user_id = auth.uid()
  )
);

CREATE POLICY consent_grants_farmer_update
ON consent_grants FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM farmer_profile fp
    WHERE fp.id = consent_grants.farmer_id AND fp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM farmer_profile fp
    WHERE fp.id = consent_grants.farmer_id AND fp.user_id = auth.uid()
  )
);

CREATE POLICY consent_grants_tenant_select
ON consent_grants FOR SELECT TO authenticated
USING (grantee_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

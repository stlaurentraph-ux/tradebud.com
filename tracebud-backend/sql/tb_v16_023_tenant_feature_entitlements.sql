-- TB-V16-023: Tenant feature entitlements for launch gating.
-- Purpose:
-- - Persist per-tenant module entitlements independently from trial lifecycle state.
-- - Keep role/permission checks separate from commercial feature packaging.

CREATE TABLE IF NOT EXISTS tenant_feature_entitlements (
  tenant_id TEXT NOT NULL,
  feature_key TEXT NOT NULL CHECK (
    feature_key IN (
      'dashboard_campaigns',
      'dashboard_compliance',
      'dashboard_reporting',
      'dashboard_exports'
    )
  ),
  entitlement_status TEXT NOT NULL CHECK (entitlement_status IN ('enabled', 'disabled', 'trial')),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_feature_entitlements_active
  ON tenant_feature_entitlements (tenant_id, feature_key, effective_from, effective_to);

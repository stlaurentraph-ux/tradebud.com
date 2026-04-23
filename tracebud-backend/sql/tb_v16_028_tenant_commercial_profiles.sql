-- TB-V16-028: tenant commercial profile persistence for launch onboarding.
-- Purpose: persist workspace setup and optional commercial profile attributes per tenant.

BEGIN;

CREATE TABLE IF NOT EXISTS tenant_commercial_profiles (
  tenant_id TEXT PRIMARY KEY,
  organization_name TEXT NULL,
  country TEXT NULL,
  primary_role TEXT NULL CHECK (primary_role IN ('importer', 'exporter', 'compliance_manager', 'admin')),
  team_size TEXT NULL,
  main_commodity TEXT NULL,
  primary_objective TEXT NULL CHECK (primary_objective IN (
    'prepare_first_due_diligence_package',
    'supplier_onboarding',
    'risk_screening',
    'audit_readiness'
  )),
  profile_skipped BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_commercial_profiles_role
ON tenant_commercial_profiles (primary_role, updated_at DESC);

COMMIT;

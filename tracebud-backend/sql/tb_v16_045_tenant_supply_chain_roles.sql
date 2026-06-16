-- TB-V16-045: tenant supply chain roles for multi-role organisations
-- e.g. cooperative + exporter, or brand with both exporter and importer workflows

BEGIN;

ALTER TABLE tenant_commercial_profiles
  ADD COLUMN IF NOT EXISTS supply_chain_roles TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN tenant_commercial_profiles.supply_chain_roles IS
  'Supply chain personas enabled for this tenant: cooperative, exporter, importer';

COMMIT;

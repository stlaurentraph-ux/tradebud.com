-- TB-V16-044: Compliance issue ownership metadata for cross-tenant visibility.
-- Adds owner_role so downstream tenants can see upstream blockers without duplicate ownership.

BEGIN;

ALTER TABLE compliance_issues
  ADD COLUMN IF NOT EXISTS owner_role TEXT NULL CHECK (
    owner_role IN ('cooperative', 'exporter', 'importer', 'farmer', 'system')
  );

CREATE INDEX IF NOT EXISTS idx_compliance_issues_owner_role
  ON compliance_issues (tenant_id, owner_role, status);

COMMIT;

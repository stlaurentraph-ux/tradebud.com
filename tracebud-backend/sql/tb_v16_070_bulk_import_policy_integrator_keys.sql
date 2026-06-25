-- TB-V16-066: Bulk import policy toggles + Tracebud-approved integrator signing keys

BEGIN;

CREATE TABLE IF NOT EXISTS tenant_bulk_import_policy (
  tenant_id TEXT PRIMARY KEY,
  require_signed_packages BOOLEAN NOT NULL DEFAULT FALSE,
  accept_integrator_signatures BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integrator_import_signing_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integrator_id TEXT NOT NULL,
  kid TEXT NOT NULL UNIQUE,
  algorithm TEXT NOT NULL DEFAULT 'ed25519' CHECK (algorithm = 'ed25519'),
  public_key_pem TEXT NOT NULL,
  label TEXT NOT NULL,
  allowed_source_systems TEXT[] NULL,
  revoked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrator_import_signing_keys_active
  ON integrator_import_signing_keys (revoked_at, integrator_id);

COMMIT;

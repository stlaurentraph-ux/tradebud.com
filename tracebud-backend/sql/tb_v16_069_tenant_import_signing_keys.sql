-- TB-V16-065: Tenant-scoped Ed25519 public keys for tracebud_import_v1 package signatures

BEGIN;

CREATE TABLE IF NOT EXISTS tenant_import_signing_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  kid TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'ed25519' CHECK (algorithm = 'ed25519'),
  public_key_pem TEXT NOT NULL,
  label TEXT NOT NULL,
  created_by_id TEXT NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, kid)
);

CREATE INDEX IF NOT EXISTS idx_tenant_import_signing_keys_tenant_active
  ON tenant_import_signing_keys (tenant_id, revoked_at, created_at DESC);

COMMIT;

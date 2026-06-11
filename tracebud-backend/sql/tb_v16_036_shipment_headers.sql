-- TB-V16-036: canonical shipment headers linked to DDS packages (batches).

BEGIN;

CREATE TABLE IF NOT EXISTS shipment_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  external_id TEXT NULL,
  shipment_reference TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (
    status IN ('DRAFT', 'READY', 'SEALED', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'ARCHIVED', 'ON_HOLD')
  ),
  declared_quantity_kg NUMERIC(12, 3) NOT NULL,
  covered_quantity_kg NUMERIC(12, 3) NOT NULL,
  sealed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shipment_headers_tenant_external
  ON shipment_headers (tenant_id, external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shipment_headers_tenant_created
  ON shipment_headers (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS shipment_header_packages (
  shipment_header_id UUID NOT NULL REFERENCES shipment_headers (id) ON DELETE CASCADE,
  dds_package_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (shipment_header_id, dds_package_id)
);

CREATE INDEX IF NOT EXISTS idx_shipment_header_packages_package
  ON shipment_header_packages (dds_package_id);

COMMIT;

-- S6.4 — plot geometry approval for shipment coverage + tenant policy
ALTER TABLE plot
  ADD COLUMN IF NOT EXISTS geometry_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS geometry_approved_by UUID REFERENCES user_account (id);

CREATE TABLE IF NOT EXISTS tenant_geometry_policy (
  tenant_id TEXT PRIMARY KEY,
  geometry_sync_min_tier TEXT NOT NULL DEFAULT 'moderate'
    CHECK (geometry_sync_min_tier IN ('high', 'moderate', 'low')),
  shipment_geometry_ack_mode TEXT NOT NULL DEFAULT 'warn'
    CHECK (shipment_geometry_ack_mode IN ('warn', 'block')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plot_geometry_approved_at
  ON plot (geometry_approved_at)
  WHERE geometry_approved_at IS NOT NULL;

-- TB-V16-004: audit gated-entry query index support
-- Purpose: accelerate tenant-scoped deferred-route telemetry lookups used by
-- GET /v1/audit/gated-entry (event_type + tenantId/gate filters with timestamp ordering).

CREATE INDEX IF NOT EXISTS idx_audit_log_gated_entry_tenant_gate_ts
ON audit_log (
  event_type,
  (payload ->> 'tenantId'),
  (payload ->> 'gate'),
  timestamp DESC
);

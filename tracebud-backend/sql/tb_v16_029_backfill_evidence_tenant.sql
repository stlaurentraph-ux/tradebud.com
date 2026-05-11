-- TB-V16-029: backfill tenantId for historical plot_evidence_synced audit events.
-- Purpose: restore tenant-scoped importer evidence-feed visibility for legacy events
-- created before tenantId was written in plot evidence sync payloads.
--
-- Safety strategy (fail-closed):
-- 1) only update rows where payload.tenantId is missing/empty
-- 2) prefer deterministic actor mapping via request_campaigns.created_by -> tenant_id
-- 3) fallback only if workspace has exactly one known tenant across launch/admin tables

BEGIN;

WITH actor_tenant_candidates AS (
  SELECT
    al.id AS audit_id,
    rc.tenant_id
  FROM audit_log al
  INNER JOIN request_campaigns rc
    ON rc.created_by = al.user_id::text
  WHERE al.event_type = 'plot_evidence_synced'
    AND COALESCE(al.payload ->> 'tenantId', '') = ''
),
actor_tenant_unique AS (
  SELECT audit_id, MIN(tenant_id) AS tenant_id
  FROM actor_tenant_candidates
  GROUP BY audit_id
  HAVING COUNT(DISTINCT tenant_id) = 1
)
UPDATE audit_log al
SET payload = jsonb_set(al.payload, '{tenantId}', to_jsonb(atu.tenant_id), true)
FROM actor_tenant_unique atu
WHERE al.id = atu.audit_id
  AND COALESCE(al.payload ->> 'tenantId', '') = '';

WITH singleton_tenant AS (
  SELECT tenant_id
  FROM (
    SELECT tenant_id FROM tenant_launch_state
    UNION
    SELECT tenant_id FROM tenant_commercial_profiles
    UNION
    SELECT tenant_id FROM admin_organizations
  ) t
  GROUP BY tenant_id
  HAVING COUNT(*) >= 1
),
singleton_guard AS (
  SELECT MIN(tenant_id) AS tenant_id
  FROM singleton_tenant
  HAVING COUNT(*) = 1
)
UPDATE audit_log al
SET payload = jsonb_set(al.payload, '{tenantId}', to_jsonb(sg.tenant_id), true)
FROM singleton_guard sg
WHERE al.event_type = 'plot_evidence_synced'
  AND COALESCE(al.payload ->> 'tenantId', '') = '';

COMMIT;

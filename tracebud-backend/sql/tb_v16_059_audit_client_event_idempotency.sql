-- Idempotent field audit writes: one row per (user, event_type, clientEventId).
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_log_user_event_client_event_id
ON audit_log (user_id, event_type, ((payload ->> 'clientEventId')))
WHERE (payload ->> 'clientEventId') IS NOT NULL
  AND btrim(payload ->> 'clientEventId') <> '';

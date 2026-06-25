-- Harvest idempotency: enforce at most one harvest_transaction per (farmer_id, client_event_id).
--
-- The field app retries POST /harvest with the same client_event_id when a 200 is lost, when a
-- sync queue drain runs twice, or after a local write failure. The application layer already
-- replays the existing transaction (see HarvestService.create), but this index is the durable
-- backstop against the concurrent (TOCTOU) case where two requests race past the lookup and both
-- insert — which would create duplicate vouchers (compliance + billing impact).
--
-- Scope is (farmer_id, client_event_id) because client_event_id (`pending-sync-<localRowId>`) is
-- only unique per device, not globally.
--
-- NON-DESTRUCTIVE: if legacy duplicates already exist, this migration logs them and SKIPS index
-- creation so a deploy never fails. De-duplicate the offending rows, then re-run to enforce it.
DO $$
DECLARE
  dup_groups integer;
BEGIN
  SELECT count(*) INTO dup_groups
  FROM (
    SELECT farmer_id, client_event_id
    FROM harvest_transaction
    WHERE client_event_id IS NOT NULL
      AND btrim(client_event_id) <> ''
    GROUP BY farmer_id, client_event_id
    HAVING count(*) > 1
  ) d;

  IF dup_groups > 0 THEN
    RAISE WARNING
      'tb_v16_071: % duplicate (farmer_id, client_event_id) harvest group(s) found; unique index NOT created. De-duplicate, then re-run this migration.',
      dup_groups;
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS idx_harvest_transaction_farmer_client_event_id
      ON harvest_transaction (farmer_id, client_event_id)
      WHERE client_event_id IS NOT NULL
        AND btrim(client_event_id) <> '';
    RAISE NOTICE 'tb_v16_071: created unique index idx_harvest_transaction_farmer_client_event_id.';
  END IF;
END $$;

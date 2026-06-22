-- Field-app delivery receipts: preserve original log time across cross-device sync.
ALTER TABLE harvest_transaction
  ADD COLUMN IF NOT EXISTS client_event_id TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_harvest_transaction_client_event_id
  ON harvest_transaction (client_event_id)
  WHERE client_event_id IS NOT NULL;

-- Harvest actor attribution for audit and field-app submissions.

ALTER TABLE harvest_transaction
  ADD COLUMN IF NOT EXISTS created_by UUID NULL;

CREATE INDEX IF NOT EXISTS idx_harvest_transaction_created_by
  ON harvest_transaction (created_by)
  WHERE created_by IS NOT NULL;

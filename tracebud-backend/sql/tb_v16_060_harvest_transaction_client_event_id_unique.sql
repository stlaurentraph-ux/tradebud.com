-- Server-side idempotency for harvest transaction creation (B3).
-- Replays of the same client_event_id from the offline queue must not create
-- duplicate voucher + transaction rows. Partial unique index excludes NULL
-- client_event_id (legacy / dashboard-created harvests remain unconstrained).
CREATE UNIQUE INDEX IF NOT EXISTS uq_harvest_transaction_farmer_client_event
  ON harvest_transaction (farmer_id, client_event_id)
  WHERE client_event_id IS NOT NULL;

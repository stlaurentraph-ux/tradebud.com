-- Stripe webhook idempotency ledger (H7): dedupe by event.id before invoice reconciliation.
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE stripe_webhook_events IS 'Processed Stripe webhook event ids for at-least-once delivery dedupe.';

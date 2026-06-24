-- Multi-plot delivery trip grouping for single-scan buyer intake (FEAT-011 Phase B).

ALTER TABLE voucher
  ADD COLUMN IF NOT EXISTS delivery_trip_ref TEXT;

CREATE INDEX IF NOT EXISTS idx_voucher_delivery_trip_ref
  ON voucher (delivery_trip_ref)
  WHERE delivery_trip_ref IS NOT NULL;

-- Mirror: tb_v16_060_delivery_trip_ref.sql

ALTER TABLE public.voucher
  ADD COLUMN IF NOT EXISTS delivery_trip_ref TEXT;

CREATE INDEX IF NOT EXISTS idx_voucher_delivery_trip_ref
  ON public.voucher (delivery_trip_ref)
  WHERE delivery_trip_ref IS NOT NULL;

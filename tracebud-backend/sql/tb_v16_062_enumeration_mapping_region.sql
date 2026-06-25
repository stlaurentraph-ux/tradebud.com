-- TB-V16-062: cooperative enumeration mapping region (district tile bootstrap)
-- Post phase-1 schema split: request_campaigns lives in ops.

BEGIN;

ALTER TABLE ops.request_campaigns
  ADD COLUMN IF NOT EXISTS mapping_region_label TEXT NULL;

ALTER TABLE ops.request_campaigns
  ADD COLUMN IF NOT EXISTS mapping_region_west DOUBLE PRECISION NULL;

ALTER TABLE ops.request_campaigns
  ADD COLUMN IF NOT EXISTS mapping_region_south DOUBLE PRECISION NULL;

ALTER TABLE ops.request_campaigns
  ADD COLUMN IF NOT EXISTS mapping_region_east DOUBLE PRECISION NULL;

ALTER TABLE ops.request_campaigns
  ADD COLUMN IF NOT EXISTS mapping_region_north DOUBLE PRECISION NULL;

COMMIT;

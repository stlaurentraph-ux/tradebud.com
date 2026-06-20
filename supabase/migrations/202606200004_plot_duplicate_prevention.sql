-- Prevent duplicate plot rows from sync retries (orphan rows without client_plot_id).

-- 1) Rename CRM demo plot that was mislabeled as a device plot name.
UPDATE plot
SET name = 'Carl kjelsens',
    updated_at = NOW()
WHERE client_plot_id IS NULL
  AND name = 'Plot 3'
  AND id = '39d548f9-1ef4-449b-9ebd-fd244ae5d69e';

-- 2) Drop orphan duplicates: keep the newest row per farmer + display name + kind.
DELETE FROM plot p
USING (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY farmer_id, lower(btrim(name)), kind
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM plot
  WHERE client_plot_id IS NULL
    AND name IS NOT NULL
    AND btrim(name) <> ''
) d
WHERE p.id = d.id
  AND d.rn > 1;

-- 3) One orphan row per farmer + display name + kind (CRM/demo rows without client_plot_id).
CREATE UNIQUE INDEX IF NOT EXISTS plot_farmer_orphan_name_kind_key
  ON plot (farmer_id, lower(btrim(name)), kind)
  WHERE client_plot_id IS NULL
    AND name IS NOT NULL
    AND btrim(name) <> '';

COMMENT ON INDEX plot_farmer_orphan_name_kind_key IS
  'Blocks duplicate device-upload retries that omit client_plot_id. Stable idempotency uses plot_farmer_client_plot_id_key.';

-- Stable offline client id for plot sync; human-readable label stays in plot.name.
ALTER TABLE plot
  ADD COLUMN IF NOT EXISTS client_plot_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS plot_farmer_client_plot_id_key
  ON plot (farmer_id, client_plot_id)
  WHERE client_plot_id IS NOT NULL;

UPDATE plot
SET client_plot_id = name
WHERE client_plot_id IS NULL
  AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9]+$';

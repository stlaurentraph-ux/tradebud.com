-- Plot verification: under_review status, production system, last GFW screening snapshot.

DO $$
BEGIN
  ALTER TYPE plot_status ADD VALUE IF NOT EXISTS 'under_review';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.plot
  ADD COLUMN IF NOT EXISTS production_system TEXT,
  ADD COLUMN IF NOT EXISTS deforestation_screening JSONB;

COMMENT ON COLUMN public.plot.production_system IS
  'Farmer-reported production system: monoculture | agroforestry | shade_grown | silvopasture';

COMMENT ON COLUMN public.plot.deforestation_screening IS
  'Latest immutable GFW screening snapshot (cutoff, alerts, dataset, provider mode, screenedAt).';

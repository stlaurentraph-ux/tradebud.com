-- Plot geometry capture confidence metadata (field app → dashboard map hero).
ALTER TABLE plot
  ADD COLUMN IF NOT EXISTS geometry_capture JSONB NULL;

COMMENT ON COLUMN plot.geometry_capture IS
  'Advisory capture metadata: confidence tier/score, capture method, optional offline imagery pack id.';

-- plot.status stored enum value `compliant` read as full EUDR compliance in Supabase Table Editor.
-- Rename to deforestation_clear — GFW screening clear only, not tenure or shipment readiness.
ALTER TYPE plot_status RENAME VALUE 'compliant' TO 'deforestation_clear';

COMMENT ON COLUMN plot.status IS
  'Deforestation screening status (GFW satellite)—NOT full EUDR or land-tenure compliance. '
  'pending_check = not screened; deforestation_clear = no deforestation signal since EUDR cutoff; '
  'under_review / degradation_risk / deforestation_detected = review or block. '
  'Tenure: plot_tenure_verification + evidence. Shipment readiness: CRM EUDR checklist.';

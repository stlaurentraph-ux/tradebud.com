-- plot.status is deforestation screening (GFW), not full EUDR or tenure compliance.
COMMENT ON COLUMN plot.status IS
  'Deforestation screening status (GFW satellite)—NOT full EUDR or land-tenure compliance. '
  'pending_check = not screened; compliant = no deforestation signal since EUDR cutoff; '
  'under_review / degradation_risk / deforestation_detected = review or block. '
  'Tenure: plot_tenure_verification + evidence. Shipment readiness: CRM EUDR checklist.';

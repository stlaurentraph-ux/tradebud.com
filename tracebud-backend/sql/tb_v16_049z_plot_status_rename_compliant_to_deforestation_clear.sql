-- TB-V16-049z: rename plot_status enum value for Table Editor clarity
-- Mirror of supabase/migrations/202606200004_plot_status_rename_compliant_to_deforestation_clear.sql
-- Already applied on Tracebud CRM (2026-06-20). Safe to skip on databases that already use deforestation_clear.

BEGIN;

ALTER TYPE plot_status RENAME VALUE 'compliant' TO 'deforestation_clear';

COMMENT ON COLUMN plot.status IS
  'Deforestation screening status (GFW satellite)—NOT full EUDR or land-tenure compliance. '
  'pending_check = not screened; deforestation_clear = no deforestation signal since EUDR cutoff; '
  'under_review / degradation_risk / deforestation_detected = review or block. '
  'Tenure: plot_tenure_verification + evidence. Shipment readiness: CRM EUDR checklist.';

COMMIT;

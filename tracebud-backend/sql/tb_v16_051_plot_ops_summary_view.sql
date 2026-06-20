-- Ops-friendly read model for Supabase Table Editor.
-- Browse plot_ops_summary for support/CRM; use plot for engineering (geometry/jsonb).

-- ── plot column documentation (canonical table) ─────────────────────────────

COMMENT ON TABLE plot IS
  'Canonical plot record: geometry, GFW deforestation screening, overlap flags. '
  'Counts and EUDR dossier readiness live in plot_ops_summary VIEW — not here.';

COMMENT ON COLUMN plot.id IS 'Server plot UUID (primary key).';
COMMENT ON COLUMN plot.farmer_id IS 'Owning farmer_profile.id — tenant scope flows through farmer.';
COMMENT ON COLUMN plot.farmer_display_name IS
  'Denormalized farmer label for Table Editor (CRM name → user_account.name → id prefix).';
COMMENT ON COLUMN plot.name IS 'Display name (farmer-facing label, e.g. Plot 1). Not the stable device id.';
COMMENT ON COLUMN plot.client_plot_id IS
  'Stable offline device plot id from field upload. NULL = CRM/manual/demo row. NOT NULL = uploaded from app.';
COMMENT ON COLUMN plot.kind IS 'Field capture kind: point (pin) or polygon (walked boundary).';
COMMENT ON COLUMN plot.created_at IS 'First time this plot row was created on the server.';
COMMENT ON COLUMN plot.updated_at IS 'Last server-side update (metadata, geometry, screening, overlaps).';

COMMENT ON COLUMN plot.geography IS
  'Compliance geography (WGS84). Used for area math, overlap checks, geo-verified photos. Prefer over geometry.';
COMMENT ON COLUMN plot.geometry IS 'Legacy PostGIS geometry; prefer geography for compliance operations.';
COMMENT ON COLUMN plot.centroid IS 'Optional display centroid derived from geography.';
COMMENT ON COLUMN plot.area_ha IS 'Server-computed area (ha) from geography when available.';
COMMENT ON COLUMN plot.declared_area_ha IS 'Farmer-declared area at capture time.';
COMMENT ON COLUMN plot.area_discrepancy_pct IS 'Percent difference declared vs computed area.';
COMMENT ON COLUMN plot.precision_m_at_capture IS 'GPS precision (m) when boundary/pin was captured.';
COMMENT ON COLUMN plot.hdop_at_capture IS 'Horizontal dilution of precision at capture.';
COMMENT ON COLUMN plot.geometry_capture IS
  'JSON capture metadata (walk quality, method). Raw — see plot_ops_summary.field_capture_label.';

COMMENT ON COLUMN plot.status IS
  'Deforestation screening status (GFW satellite) ONLY — NOT land tenure, NOT full EUDR/shipment compliance. '
  'Values: pending_check | deforestation_clear | under_review | degradation_risk | deforestation_detected. '
  'Human labels: plot_ops_summary.deforestation_screening_label. '
  'Shipment readiness: plot_ops_summary.eudr_dossier_ready_hint + CRM plot detail.';

COMMENT ON COLUMN plot.deforestation_screening IS
  'GFW screening snapshot JSON (alerts, tier, screenedAt). Does not include tenure or deliveries.';
COMMENT ON COLUMN plot.production_system IS 'Agroforestry/production system context for screening auto-review.';

COMMENT ON COLUMN plot.sinaph_overlap IS
  'TRUE when plot geography overlaps protected forest (SINAPH) — may require permit evidence.';
COMMENT ON COLUMN plot.indigenous_overlap IS
  'TRUE when plot geography overlaps indigenous/community land — may require FPIC evidence.';

-- ── plot_ops_summary view ───────────────────────────────────────────────────

CREATE OR REPLACE VIEW plot_ops_summary AS
WITH
  legal_latest AS (
    SELECT DISTINCT ON (payload ->> 'plotId')
      (payload ->> 'plotId')::uuid AS plot_id,
      NULLIF(BTRIM(payload ->> 'cadastralKey'), '') AS cadastral_key,
      CASE
        WHEN payload ->> 'informalTenure' IN ('true', 't') THEN TRUE
        WHEN payload ->> 'informalTenure' IN ('false', 'f') THEN FALSE
        ELSE NULL
      END AS informal_tenure,
      timestamp AS legal_synced_at
    FROM audit_log
    WHERE event_type = 'plot_legal_synced'
      AND payload ? 'plotId'
    ORDER BY payload ->> 'plotId', timestamp DESC
  ),
  tenure_agg AS (
    SELECT
      plot_id,
      COUNT(*)::int AS tenure_verification_count,
      MAX(updated_at) AS tenure_last_updated_at,
      CASE
        WHEN BOOL_OR(parse_status = 'MANUAL_REQUIRED') THEN 'manual_required'
        WHEN BOOL_OR(parse_status = 'FAILED') THEN 'failed'
        WHEN BOOL_OR(parse_status IN ('PENDING', 'IN_PROGRESS')) THEN 'pending'
        WHEN COUNT(*) FILTER (WHERE parse_status = 'COMPLETED') > 0 THEN 'completed'
        ELSE 'none'
      END AS tenure_parse_status
    FROM plot_tenure_verification
    GROUP BY plot_id
  ),
  evidence_agg AS (
    SELECT
      plot_id,
      COUNT(*)::int AS evidence_doc_count,
      COUNT(*) FILTER (WHERE evidence_kind = 'tenure_evidence')::int AS tenure_evidence_count,
      COUNT(*) FILTER (WHERE evidence_kind = 'fpic_repository')::int AS fpic_doc_count,
      COUNT(*) FILTER (WHERE evidence_kind = 'protected_area_permit')::int AS permit_doc_count,
      MAX(updated_at) AS evidence_last_updated_at
    FROM evidence_documents
    GROUP BY plot_id
  ),
  harvest_agg AS (
    SELECT
      plot_id,
      COUNT(*)::int AS delivery_count,
      COALESCE(SUM(kg), 0)::numeric AS total_harvest_kg,
      MAX(harvest_date) AS last_delivery_date,
      MAX(created_at) AS last_delivery_at
    FROM harvest_transaction
    GROUP BY plot_id
  ),
  photo_latest AS (
    SELECT DISTINCT ON (payload ->> 'plotId')
      (payload ->> 'plotId')::uuid AS plot_id,
      payload -> 'photos' AS photos,
      timestamp AS photos_synced_at
    FROM audit_log
    WHERE event_type = 'plot_photos_synced'
      AND payload ->> 'kind' = 'ground_truth'
      AND payload ? 'plotId'
    ORDER BY payload ->> 'plotId', timestamp DESC
  ),
  photo_agg AS (
    SELECT
      plot_id,
      COALESCE(jsonb_array_length(photos), 0)::int AS ground_truth_photo_count,
      photos_synced_at
    FROM photo_latest
  )
SELECT
  p.id AS plot_id,
  p.name,
  p.farmer_id,
  p.farmer_display_name,
  p.client_plot_id,
  CASE
    WHEN p.id = '39d548f9-1ef4-449f-9ebd-fd244ae5d69e'::uuid THEN 'demo'
    WHEN NULLIF(BTRIM(p.client_plot_id), '') IS NOT NULL THEN 'device'
    ELSE 'crm'
  END AS upload_source,
  CASE
    WHEN p.kind = 'polygon' AND p.geography IS NOT NULL THEN 'mapped_boundary'
    WHEN p.kind = 'polygon' THEN 'polygon_pending'
    WHEN p.kind = 'point' THEN 'pin_location'
    ELSE 'unknown'
  END AS field_capture_code,
  CASE
    WHEN p.kind = 'polygon' AND p.geography IS NOT NULL THEN 'Mapped boundary'
    WHEN p.kind = 'polygon' THEN 'Polygon — boundary pending'
    WHEN p.kind = 'point' THEN 'Pin location'
    ELSE 'Unknown capture'
  END AS field_capture_label,
  p.kind,
  p.created_at,
  p.updated_at,
  COALESCE(
    NULLIF(p.deforestation_screening ->> 'screenedAt', '')::timestamptz,
    p.updated_at
  ) AS last_screened_at,
  p.status::text AS deforestation_screening_status,
  CASE p.status::text
    WHEN 'deforestation_clear' THEN 'Deforestation clear'
    WHEN 'pending_check' THEN 'Screening pending'
    WHEN 'under_review' THEN 'Under review'
    WHEN 'degradation_risk' THEN 'Degradation / overlap risk'
    WHEN 'deforestation_detected' THEN 'Deforestation signal'
    ELSE p.status::text
  END AS deforestation_screening_label,
  NULLIF(p.deforestation_screening ->> 'signalTier', '') AS deforestation_signal_tier,
  p.sinaph_overlap,
  p.indigenous_overlap,
  COALESCE(ten.tenure_verification_count, 0) AS tenure_verification_count,
  COALESCE(ten.tenure_parse_status, 'none') AS tenure_parse_status,
  ten.tenure_last_updated_at,
  leg.cadastral_key,
  leg.informal_tenure,
  leg.legal_synced_at,
  CASE
    WHEN leg.informal_tenure IS TRUE
      AND (
        COALESCE(ten.tenure_verification_count, 0) > 0
        OR COALESCE(ev.tenure_evidence_count, 0) > 0
        OR leg.cadastral_key IS NOT NULL
      ) THEN 'producer_in_possession'
    WHEN leg.cadastral_key IS NOT NULL
      OR COALESCE(ten.tenure_verification_count, 0) > 0
      OR COALESCE(ev.tenure_evidence_count, 0) > 0 THEN 'formal_documented'
    WHEN leg.cadastral_key IS NULL
      AND COALESCE(ten.tenure_verification_count, 0) = 0
      AND COALESCE(ev.tenure_evidence_count, 0) = 0 THEN 'missing'
    ELSE 'undeclared'
  END AS land_tenure_status,
  CASE
    WHEN leg.informal_tenure IS TRUE
      AND (
        COALESCE(ten.tenure_verification_count, 0) > 0
        OR COALESCE(ev.tenure_evidence_count, 0) > 0
        OR leg.cadastral_key IS NOT NULL
      ) THEN 'Producer in possession'
    WHEN leg.cadastral_key IS NOT NULL
      OR COALESCE(ten.tenure_verification_count, 0) > 0
      OR COALESCE(ev.tenure_evidence_count, 0) > 0 THEN 'Documented'
    WHEN leg.cadastral_key IS NULL
      AND COALESCE(ten.tenure_verification_count, 0) = 0
      AND COALESCE(ev.tenure_evidence_count, 0) = 0 THEN 'Missing documentation'
    ELSE 'Not declared yet'
  END AS land_tenure_label,
  COALESCE(ev.evidence_doc_count, 0) AS evidence_doc_count,
  COALESCE(ev.tenure_evidence_count, 0) AS tenure_evidence_count,
  COALESCE(ev.fpic_doc_count, 0) AS fpic_doc_count,
  COALESCE(ev.permit_doc_count, 0) AS permit_doc_count,
  ev.evidence_last_updated_at,
  COALESCE(ph.ground_truth_photo_count, 0) AS ground_truth_photo_count,
  ph.photos_synced_at AS ground_truth_photos_synced_at,
  COALESCE(hv.delivery_count, 0) AS delivery_count,
  COALESCE(hv.total_harvest_kg, 0) AS total_harvest_kg,
  hv.last_delivery_date,
  hv.last_delivery_at,
  p.area_ha,
  p.declared_area_ha,
  p.area_discrepancy_pct,
  (p.geography IS NOT NULL) AS has_geography,
  (
    p.status = 'deforestation_clear'::plot_status
    AND (
      (p.kind = 'polygon'::plot_kind AND p.geography IS NOT NULL)
      OR (
        p.kind = 'point'::plot_kind
        AND COALESCE(p.area_ha, p.declared_area_ha, 0) > 0
        AND COALESCE(p.area_ha, p.declared_area_ha, 0) < 4
      )
    )
    AND CASE
      WHEN leg.informal_tenure IS TRUE
        AND (
          COALESCE(ten.tenure_verification_count, 0) > 0
          OR COALESCE(ev.tenure_evidence_count, 0) > 0
          OR leg.cadastral_key IS NOT NULL
        ) THEN TRUE
      WHEN leg.cadastral_key IS NOT NULL
        OR COALESCE(ten.tenure_verification_count, 0) > 0
        OR COALESCE(ev.tenure_evidence_count, 0) > 0 THEN TRUE
      ELSE FALSE
    END
    AND (
      p.status <> 'under_review'::plot_status
      OR COALESCE(ph.ground_truth_photo_count, 0) >= 4
    )
  ) AS eudr_dossier_ready_hint
FROM plot p
LEFT JOIN legal_latest leg ON leg.plot_id = p.id
LEFT JOIN tenure_agg ten ON ten.plot_id = p.id
LEFT JOIN evidence_agg ev ON ev.plot_id = p.id
LEFT JOIN harvest_agg hv ON hv.plot_id = p.id
LEFT JOIN photo_agg ph ON ph.plot_id = p.id;

COMMENT ON VIEW plot_ops_summary IS
  'Default Supabase browse surface for ops/support. One row per plot with human-readable '
  'screening/tenure labels and aggregated counts. Canonical writes still go to plot + child tables. '
  'eudr_dossier_ready_hint is approximate — CRM plot detail is authoritative for shipment filing.';

COMMENT ON COLUMN plot_ops_summary.plot_id IS 'Same as plot.id — use for joins back to plot.';
COMMENT ON COLUMN plot_ops_summary.upload_source IS 'device = field app upload; crm = manual/seed; demo = CRM demo plot.';
COMMENT ON COLUMN plot_ops_summary.deforestation_screening_status IS 'Raw plot.status enum — GFW screening only, not EUDR compliance.';
COMMENT ON COLUMN plot_ops_summary.deforestation_screening_label IS 'Human-readable GFW screening label for Table Editor.';
COMMENT ON COLUMN plot_ops_summary.land_tenure_status IS 'Derived tenure path code — see land_tenure_label for display.';
COMMENT ON COLUMN plot_ops_summary.land_tenure_label IS 'Human-readable land tenure summary (not deforestation screening).';
COMMENT ON COLUMN plot_ops_summary.eudr_dossier_ready_hint IS
  'Approximate all-clear for ops sorting. FALSE does not list specific gaps — open CRM plot detail. '
  'NOT the same as plot.status / deforestation_screening_label.';
